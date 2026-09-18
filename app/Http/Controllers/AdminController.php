<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\AnalyticsEvent;
use App\Models\CheckIn;
use App\Models\Feedback;
use App\Models\Medication;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserPushToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules;

class AdminController extends Controller
{
    // ── Role gates ─────────────────────────────────────────────────────────
    // support = read-only; admin = day-to-day writes; owner = account control.

    private function requireWrite(): void
    {
        abort_unless(auth()->user()->canWriteAdmin(), 403, 'Support role is read-only.');
    }

    private function requireOwner(): void
    {
        abort_unless(auth()->user()->canManageAccounts(), 403, 'Only an owner can perform this action.');
    }

    public function dashboard()
    {
        $stats = [
            'total_users' => User::count(),
            'verified_users' => User::whereNotNull('email_verified_at')->count(),
            'total_checkins' => CheckIn::count(),
            'checkins_week' => CheckIn::where('created_at', '>=', now()->subDays(7))->count(),
            'new_users_week' => User::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        $recent = User::latest()
            ->take(10)
            ->get()
            ->map(fn ($u) => ['user' => $u]);

        return view('admin.dashboard', compact('stats', 'recent'));
    }

    public function users(Request $request)
    {
        $query = User::with('checkIns');

        if ($search = $request->input('q')) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        if ($verified = $request->input('verified')) {
            if ($verified === 'yes') {
                $query->whereNotNull('email_verified_at');
            } elseif ($verified === 'no') {
                $query->whereNull('email_verified_at');
            }
        }

        $users = $query->latest()->paginate(20)->withQueryString();

        $users->getCollection()->transform(fn ($u) => [
            'user' => $u,
            'checkinCount' => $u->checkIns->count(),
        ]);

        return view('admin.users', compact('users'));
    }

    public function userDetail(User $user)
    {
        $user->load([
            'profile',
            'medications',
            'checkIns' => fn ($q) => $q->latest()->take(10),
        ]);

        // The relation above is capped at 10 for display, so
        // $user->checkIns->count() in the view reported 10 for a user with 400.
        // Count separately, and load the subscription so the detail page can
        // show entitlement without a trip to the subscriptions list.
        $user->loadCount('checkIns');
        $user->load('subscription');

        // Weekly-reminder state. The preference is per ACCOUNT (portal_state)
        // while tokens are per DEVICE, and both must line up for the Sunday cron
        // to deliver — so support needs to see them together. Until now nobody
        // could tell who had reminders on without a database client.
        $reminderEnabled = (bool) data_get(
            $user->profile?->portal_state ?? [],
            'reminderPreferences.enabled',
            false
        );
        $pushTokens = UserPushToken::where('user_id', $user->id)->get();

        // medication_name stores a catalog slug or a "custom_..." id, not a display name.
        $catalogNames = Medication::catalog()->pluck('name', 'slug');
        $trackedMedications = $user->medications->map(fn ($m) => [
            'name' => $catalogNames->get($m->medication_name, $m->medication_name),
            'dosage' => $m->dosage,
            'durationMonths' => $m->duration_months,
        ]);

        return view('admin.user-detail', compact('user', 'trackedMedications', 'reminderEnabled', 'pushTokens'));
    }

    public function verifyEmail(User $user)
    {
        $this->requireWrite();

        $user->update(['email_verified_at' => $user->email_verified_at ? null : now()]);
        $state = $user->email_verified_at ? 'verified' : 'unverified';

        AdminAuditLog::record('user.verify-email', $user, ['state' => $state]);

        return back()->with('success', "Email set to {$state} for {$user->name}.");
    }

    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $this->requireWrite();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => "required|email|max:255|unique:users,email,{$user->id}",
        ]);

        $original = $user->only(['name', 'email']);
        $emailChanged = $user->email !== $request->email;

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'email_verified_at' => $emailChanged ? null : $user->email_verified_at,
        ]);

        AdminAuditLog::record('user.update', $user, [
            'from' => $original,
            'to' => $user->only(['name', 'email']),
        ]);

        $msg = 'User updated.';
        if ($emailChanged) {
            $msg .= ' Email changed  verification cleared.';
        }

        return back()->with('success', $msg);
    }

    public function toggleAdmin(User $user): RedirectResponse
    {
        $this->requireOwner();

        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot change your own admin status.');
        }

        // New admins start at the standard tier; revoked admins lose their role.
        $user->update([
            'is_admin' => ! $user->is_admin,
            'role' => $user->is_admin ? null : User::ROLE_ADMIN,
        ]);
        $state = $user->is_admin ? 'granted' : 'removed';

        AdminAuditLog::record('user.toggle-admin', $user, ['state' => $state]);

        return back()->with('success', "Admin access {$state} for {$user->name}.");
    }

    public function sendPasswordReset(User $user): RedirectResponse
    {
        $this->requireWrite();

        Password::sendResetLink(['email' => $user->email]);

        AdminAuditLog::record('user.send-reset', $user);

        return back()->with('success', "Password reset email sent to {$user->email}.");
    }

    public function deleteUser(User $user): RedirectResponse
    {
        $this->requireOwner();

        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $name = $user->name;

        // Log BEFORE deleting so the target's identity is still available.
        AdminAuditLog::record('user.delete', $user, [
            'checkins' => $user->checkIns()->count(),
        ]);

        $user->tokens()->delete();
        $user->checkIns()->delete();
        optional($user->subscription)->delete();
        optional($user->profile)->delete();
        $user->delete();

        return redirect()->route('admin.users')
            ->with('success', "User \"{$name}\" and all their data deleted.");
    }

    public function createUser()
    {
        return view('admin.create-user');
    }

    public function storeUser(Request $request): RedirectResponse
    {
        $this->requireWrite();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Rules\Password::min(8)],
            'is_admin' => 'nullable|boolean',
            'verified' => 'nullable|boolean',
        ]);

        $grantAdmin = (bool) $request->input('is_admin', false);
        if ($grantAdmin) {
            $this->requireOwner();
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_admin' => $grantAdmin,
            'role' => $grantAdmin ? User::ROLE_ADMIN : null,
            'email_verified_at' => $request->boolean('verified') ? now() : null,
        ]);

        AdminAuditLog::record('user.create', $user, ['is_admin' => $grantAdmin]);

        return redirect()->route('admin.user-detail', $user)
            ->with('success', "User \"{$user->name}\" created successfully.");
    }

    public function setPassword(Request $request, User $user): RedirectResponse
    {
        $this->requireOwner();

        $request->validate([
            'new_password' => ['required', 'confirmed', Rules\Password::min(8)],
        ]);

        $user->update(['password' => Hash::make($request->new_password)]);

        AdminAuditLog::record('user.set-password', $user);

        return back()->with('success', "Password updated for {$user->name}.");
    }

    public function exportUsers(Request $request): Response
    {
        $query = User::query();

        if ($search = $request->input('q')) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }
        if ($verified = $request->input('verified')) {
            if ($verified === 'yes') {
                $query->whereNotNull('email_verified_at');
            } elseif ($verified === 'no') {
                $query->whereNull('email_verified_at');
            }
        }

        $users = $query->latest()->get();

        $lines = [];
        $lines[] = implode(',', ['ID', 'Name', 'Email', 'Verified', 'Admin', 'Joined']);

        foreach ($users as $u) {
            $lines[] = implode(',', [
                $u->id,
                '"'.str_replace('"', '""', $u->name).'"',
                '"'.str_replace('"', '""', $u->email).'"',
                $u->email_verified_at ? 'Yes' : 'No',
                $u->is_admin ? 'Yes' : 'No',
                $u->created_at->toDateString(),
            ]);
        }

        $csv = implode("\n", $lines);

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="geneorx-users-'.now()->format('Y-m-d').'.csv"',
        ]);
    }

    public function analytics(Request $request)
    {
        [$from, $to, $event] = $this->analyticsFilters($request);

        $ranged = fn () => AnalyticsEvent::query()
            ->when($event, fn ($q) => $q->where('name', $event))
            ->whereBetween('created_at', [$from, $to->copy()->endOfDay()]);

        $totalEvents = AnalyticsEvent::count();

        $dailyCounts = $ranged()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $topEvents = $ranged()
            ->selectRaw('name, COUNT(*) as count')
            ->groupBy('name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $recentEvents = $ranged()
            ->with('user')
            ->latest()
            ->limit(50)
            ->get();

        $eventsWeek = AnalyticsEvent::where('created_at', '>=', now()->subDays(7))->count();

        $uniqueUsers30d = $ranged()
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count('user_id');

        // True distinct-name count (the top-10 list undercounts it).
        $eventTypeCount = $ranged()->distinct('name')->count('name');

        // All known names for the filter dropdown.
        $eventNames = AnalyticsEvent::select('name')->distinct()->orderBy('name')->pluck('name');

        return view('admin.analytics', compact(
            'totalEvents', 'dailyCounts', 'topEvents', 'recentEvents', 'eventsWeek',
            'uniqueUsers30d', 'eventTypeCount', 'eventNames', 'from', 'to', 'event'
        ));
    }

    public function exportAnalytics(Request $request): Response
    {
        [$from, $to, $event] = $this->analyticsFilters($request);

        $lines = [implode(',', ['ID', 'Event', 'User', 'Properties', 'Created'])];

        AnalyticsEvent::query()
            ->when($event, fn ($q) => $q->where('name', $event))
            ->whereBetween('created_at', [$from, $to->copy()->endOfDay()])
            ->with('user')
            ->orderBy('id')
            ->chunk(500, function ($events) use (&$lines) {
                foreach ($events as $e) {
                    $lines[] = implode(',', [
                        $e->id,
                        '"'.str_replace('"', '""', $e->name).'"',
                        '"'.str_replace('"', '""', $e->user?->email ?? 'guest').'"',
                        '"'.str_replace('"', '""', json_encode($e->properties ?? [])).'"',
                        $e->created_at->toDateTimeString(),
                    ]);
                }
            });

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="geneorx-analytics-'.now()->format('Y-m-d').'.csv"',
        ]);
    }

    /** Shared date-range + event-name filter parsing (defaults: last 30 days). */
    private function analyticsFilters(Request $request): array
    {
        $from = $request->date('from') ?: now()->subDays(30)->startOfDay();
        $to = $request->date('to') ?: now();
        if ($from->gt($to)) {
            [$from, $to] = [$to, $from];
        }
        $event = $request->input('event') ?: null;

        return [$from, $to, $event];
    }

    // ── Feedback inbox ─────────────────────────────────────────────────────

    public function feedback(Request $request)
    {
        $query = Feedback::with('user')->latest();

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        $items = $query->paginate(25)->withQueryString();

        $counts = [
            'new' => Feedback::where('status', 'new')->count(),
            'reviewed' => Feedback::where('status', 'reviewed')->count(),
            'resolved' => Feedback::where('status', 'resolved')->count(),
        ];

        return view('admin.feedback', compact('items', 'counts'));
    }

    public function updateFeedbackStatus(Request $request, Feedback $feedback): RedirectResponse
    {
        $this->requireWrite();

        $request->validate(['status' => 'required|in:new,reviewed,resolved']);

        $feedback->update(['status' => $request->input('status')]);

        AdminAuditLog::record('feedback.status', $feedback, [
            'status' => $request->input('status'),
        ], 'Feedback #'.$feedback->id);

        return back()->with('success', "Feedback #{$feedback->id} marked {$request->input('status')}.");
    }

    // ── Subscriptions ──────────────────────────────────────────────────────

    public function subscriptions()
    {
        $activeStatuses = ['active', 'trialing'];

        $stats = [
            'total_plus' => Subscription::whereIn('status', $activeStatuses)->count(),
            'stripe_active' => Subscription::whereIn('status', $activeStatuses)
                ->where(fn ($q) => $q->where('provider', 'stripe')->orWhereNotNull('provider_subscription_id'))
                ->count(),
            'admin_overrides' => Subscription::whereNotNull('admin_override_ends_at')
                ->where('admin_override_ends_at', '>', now())
                ->count(),
            'expiring_soon' => Subscription::whereNotNull('admin_override_ends_at')
                ->whereBetween('admin_override_ends_at', [now(), now()->addDays(30)])
                ->count(),
        ];

        $expiringOverrides = Subscription::with('user')
            ->whereNotNull('admin_override_ends_at')
            ->whereBetween('admin_override_ends_at', [now(), now()->addDays(30)])
            ->orderBy('admin_override_ends_at')
            ->get();

        // Same definition the API uses (Subscription::isEntitled), so admin and
        // the app can no longer disagree about whether someone is a subscriber.
        $active = Subscription::with('user')
            ->entitled()
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return view('admin.subscriptions', compact('stats', 'expiringOverrides', 'active'));
    }

    // ── Audit log ──────────────────────────────────────────────────────────

    public function audit(Request $request)
    {
        $query = AdminAuditLog::with('admin')->latest();

        if ($action = $request->input('action')) {
            $query->where('action', $action);
        }
        if ($adminId = $request->input('admin')) {
            $query->where('admin_id', $adminId);
        }

        $logs = $query->paginate(30)->withQueryString();

        $actions = AdminAuditLog::select('action')->distinct()->orderBy('action')->pluck('action');
        $admins = User::where('is_admin', true)->orderBy('name')->get(['id', 'name']);

        return view('admin.audit', compact('logs', 'actions', 'admins'));
    }

    // ── Roles ──────────────────────────────────────────────────────────────

    public function setRole(Request $request, User $user): RedirectResponse
    {
        $this->requireOwner();

        $request->validate(['role' => 'required|in:owner,admin,support']);

        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot change your own role.');
        }
        if (! $user->is_admin) {
            return back()->with('error', 'Grant admin access first, then choose a role.');
        }

        $user->update(['role' => $request->input('role')]);

        AdminAuditLog::record('user.set-role', $user, ['role' => $request->input('role')]);

        return back()->with('success', "{$user->name} is now {$request->input('role')}.");
    }
}
