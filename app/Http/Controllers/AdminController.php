<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsEvent;
use App\Models\CheckIn;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules;

class AdminController extends Controller
{
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
        $user->load(['profile', 'checkIns' => fn ($q) => $q->latest()->take(10)]);

        return view('admin.user-detail', compact('user'));
    }

    public function verifyEmail(User $user)
    {
        $user->update(['email_verified_at' => $user->email_verified_at ? null : now()]);
        $state = $user->email_verified_at ? 'verified' : 'unverified';

        return back()->with('success', "Email set to {$state} for {$user->name}.");
    }

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

    public function toggleAdmin(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot change your own admin status.');
        }

        $user->update(['is_admin' => ! $user->is_admin]);
        $state = $user->is_admin ? 'granted' : 'removed';

        return back()->with('success', "Admin access {$state} for {$user->name}.");
    }

    public function sendPasswordReset(User $user): RedirectResponse
    {
        Password::sendResetLink(['email' => $user->email]);

        return back()->with('success', "Password reset email sent to {$user->email}.");
    }

    public function deleteUser(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $name = $user->name;

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

    public function setPassword(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'new_password' => ['required', 'confirmed', Rules\Password::min(8)],
        ]);

        $user->update(['password' => Hash::make($request->new_password)]);

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

    public function analytics()
    {
        $totalEvents = AnalyticsEvent::count();

        $dailyCounts = AnalyticsEvent::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $topEvents = AnalyticsEvent::selectRaw('name, COUNT(*) as count')
            ->groupBy('name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $recentEvents = AnalyticsEvent::with('user')
            ->latest()
            ->limit(50)
            ->get();

        $eventsWeek = AnalyticsEvent::where('created_at', '>=', now()->subDays(7))->count();

        $uniqueUsers30d = AnalyticsEvent::whereNotNull('user_id')
            ->where('created_at', '>=', now()->subDays(30))
            ->distinct('user_id')
            ->count('user_id');

        return view('admin.analytics', compact(
            'totalEvents', 'dailyCounts', 'topEvents', 'recentEvents', 'eventsWeek', 'uniqueUsers30d'
        ));
    }
}
