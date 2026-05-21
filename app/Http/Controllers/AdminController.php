<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsEvent;
use App\Models\CheckIn;
use App\Models\Subscription;
use App\Models\User;
use App\Services\PlanService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules;

class AdminController extends Controller
{
    public function __construct(private PlanService $plans) {}

    public function dashboard()
    {
        $stats = [
            'total_users' => User::count(),
            'verified_users' => User::whereNotNull('email_verified_at')->count(),
            'free_users' => User::whereDoesntHave('subscription', fn ($q) => $q->where('plan', 'plus')->whereIn('status', ['active', 'trialing']))->count(),
            'plus_users' => Subscription::where('plan', 'plus')->whereIn('status', ['active', 'trialing'])->count()
                                + Subscription::whereNotNull('admin_override_ends_at')->where('admin_override_ends_at', '>', now())->count(),
            'total_checkins' => CheckIn::count(),
            'checkins_week' => CheckIn::where('created_at', '>=', now()->subDays(7))->count(),
            'new_users_week' => User::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        $recent = User::with('subscription')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($u) => [
                'user' => $u,
                'isPlus' => $this->plans->isPlus($u),
            ]);

        return view('admin.dashboard', compact('stats', 'recent'));
    }

    public function users(Request $request)
    {
        $query = User::with(['subscription', 'checkIns']);

        if ($search = $request->input('q')) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        if ($plan = $request->input('plan')) {
            if ($plan === 'plus') {
                $query->whereHas('subscription', fn ($q) => $q->where('plan', 'plus')->whereIn('status', ['active', 'trialing']))
                    ->orWhereHas('subscription', fn ($q) => $q->whereNotNull('admin_override_ends_at')->where('admin_override_ends_at', '>', now()));
            } elseif ($plan === 'free') {
                $query->whereDoesntHave('subscription', fn ($q) => $q->where('plan', 'plus')->whereIn('status', ['active', 'trialing']));
            }
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
            'isPlus' => $this->plans->isPlus($u),
            'checkinCount' => $u->checkIns->count(),
        ]);

        return view('admin.users', compact('users'));
    }

    public function userDetail(User $user)
    {
        $user->load(['subscription', 'profile', 'checkIns' => fn ($q) => $q->latest()->take(10)]);
        $isPlus = $this->plans->isPlus($user);
        $subscription = $this->plans->subscriptionFor($user);

        return view('admin.user-detail', compact('user', 'isPlus', 'subscription'));
    }

    public function grantPlus(User $user)
    {
        $sub = $this->plans->subscriptionFor($user);
        $sub->update([
            'admin_override_ends_at' => now()->addYear(),
            'admin_override_reason' => 'Granted by admin on '.now()->toDateString(),
        ]);

        return back()->with('success', "Plus access granted to {$user->name} until ".now()->addYear()->toDateString().'.');
    }

    public function revokePlus(User $user)
    {
        $sub = $this->plans->subscriptionFor($user);
        $sub->update([
            'admin_override_ends_at' => null,
            'admin_override_reason' => null,
        ]);

        return back()->with('success', "Plus override removed for {$user->name}.");
    }

    public function verifyEmail(User $user)
    {
        $user->update(['email_verified_at' => $user->email_verified_at ? null : now()]);
        $state = $user->email_verified_at ? 'verified' : 'unverified';

        return back()->with('success', "Email set to {$state} for {$user->name}.");
    }

    // ── User edit ──────────────────────────────────────────────────────────────
    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => "required|email|max:255|unique:users,email,{$user->id}",
        ]);

        $emailChanged = $user->email !== $request->email;

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'email_verified_at' => $emailChanged ? null : $user->email_verified_at,
        ]);

        $msg = 'User updated.';
        if ($emailChanged) {
            $msg .= ' Email changed  verification cleared.';
        }

        return back()->with('success', $msg);
    }

    // ── Toggle admin ───────────────────────────────────────────────────────────
    public function toggleAdmin(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot change your own admin status.');
        }

        $user->update(['is_admin' => ! $user->is_admin]);
        $state = $user->is_admin ? 'granted' : 'removed';

        return back()->with('success', "Admin access {$state} for {$user->name}.");
    }

    // ── Send password reset ────────────────────────────────────────────────────
    public function sendPasswordReset(User $user): RedirectResponse
    {
        Password::sendResetLink(['email' => $user->email]);

        return back()->with('success', "Password reset email sent to {$user->email}.");
    }

    // ── Delete user ────────────────────────────────────────────────────────────
    public function deleteUser(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $name = $user->name;

        // Delete related records
        $user->tokens()->delete();
        $user->checkIns()->delete();
        optional($user->subscription)->delete();
        optional($user->profile)->delete();
        $user->delete();

        return redirect()->route('admin.users')
            ->with('success', "User \"{$name}\" and all their data deleted.");
    }

    // ── Create user ───────────────────────────────────────────────────────────
    public function createUser()
    {
        return view('admin.create-user');
    }

    public function storeUser(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Rules\Password::min(8)],
            'is_admin' => 'nullable|boolean',
            'verified' => 'nullable|boolean',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_admin' => (bool) $request->input('is_admin', false),
            'email_verified_at' => $request->boolean('verified') ? now() : null,
        ]);

        return redirect()->route('admin.user-detail', $user)
            ->with('success', "User \"{$user->name}\" created successfully.");
    }

    // ── Set password directly ─────────────────────────────────────────────────
    public function setPassword(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'new_password' => ['required', 'confirmed', Rules\Password::min(8)],
        ]);

        $user->update(['password' => Hash::make($request->new_password)]);

        return back()->with('success', "Password updated for {$user->name}.");
    }

    // ── Export users as CSV ───────────────────────────────────────────────────
    public function exportUsers(Request $request): Response
    {
        $query = User::with('subscription');

        if ($search = $request->input('q')) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }
        if ($plan = $request->input('plan')) {
            if ($plan === 'plus') {
                $query->whereHas('subscription', fn ($q) => $q->where('plan', 'plus')->whereIn('status', ['active', 'trialing']));
            } elseif ($plan === 'free') {
                $query->whereDoesntHave('subscription', fn ($q) => $q->where('plan', 'plus')->whereIn('status', ['active', 'trialing']));
            }
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
        $lines[] = implode(',', ['ID', 'Name', 'Email', 'Verified', 'Plan', 'Admin', 'Joined']);

        foreach ($users as $u) {
            $plan = $this->plans->isPlus($u) ? 'Plus' : 'Free';
            $lines[] = implode(',', [
                $u->id,
                '"'.str_replace('"', '""', $u->name).'"',
                '"'.str_replace('"', '""', $u->email).'"',
                $u->email_verified_at ? 'Yes' : 'No',
                $plan,
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

    // ── Subscriptions overview ────────────────────────────────────────────────
    public function subscriptions()
    {
        $active = Subscription::with('user')
            ->where(function ($q) {
                $q->where(fn ($q2) => $q2->where('plan', 'plus')->whereIn('status', ['active', 'trialing']))
                    ->orWhere(fn ($q2) => $q2->whereNotNull('admin_override_ends_at')->where('admin_override_ends_at', '>', now()));
            })
            ->latest()
            ->paginate(25);

        $expiringOverrides = Subscription::with('user')
            ->whereNotNull('admin_override_ends_at')
            ->where('admin_override_ends_at', '>', now())
            ->where('admin_override_ends_at', '<=', now()->addDays(30))
            ->orderBy('admin_override_ends_at')
            ->get();

        $stats = [
            'total_plus' => Subscription::where('plan', 'plus')->whereIn('status', ['active', 'trialing'])->count(),
            'admin_overrides' => Subscription::whereNotNull('admin_override_ends_at')->where('admin_override_ends_at', '>', now())->count(),
            'stripe_active' => Subscription::where('plan', 'plus')->where('status', 'active')->whereNotNull('stripe_id')->count(),
            'expiring_soon' => $expiringOverrides->count(),
        ];

        return view('admin.subscriptions', compact('active', 'expiringOverrides', 'stats'));
    }

    public function analytics()
    {
        // Total events and daily counts for the last 30 days
        $totalEvents = AnalyticsEvent::count();

        $dailyCounts = AnalyticsEvent::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top 10 event names
        $topEvents = AnalyticsEvent::selectRaw('name, COUNT(*) as count')
            ->groupBy('name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // Most recent events
        $recentEvents = AnalyticsEvent::with('user')
            ->latest()
            ->limit(50)
            ->get();

        // Events in last 7 days
        $eventsWeek = AnalyticsEvent::where('created_at', '>=', now()->subDays(7))->count();

        // Unique users tracked in last 30 days
        $uniqueUsers30d = AnalyticsEvent::whereNotNull('user_id')
            ->where('created_at', '>=', now()->subDays(30))
            ->distinct('user_id')
            ->count('user_id');

        return view('admin.analytics', compact(
            'totalEvents', 'dailyCounts', 'topEvents', 'recentEvents', 'eventsWeek', 'uniqueUsers30d'
        ));
    }
}
