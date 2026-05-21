<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class AccountController extends Controller
{
    // ── Web: Account settings page ─────────────────────────────────────────

    public function settings(): View
    {
        return view('account.settings', ['user' => Auth::user()]);
    }

    // ── Web: Change password ───────────────────────────────────────────────

    public function changePassword(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();

        if (! Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'The current password you entered is incorrect.']);
        }

        $user->forceFill(['password' => Hash::make($request->password)])->save();

        return back()->with('success', 'Password updated successfully.');
    }

    // ── Web: Delete account ────────────────────────────────────────────────

    public function deleteAccount(Request $request): RedirectResponse
    {
        $request->validate([
            'confirmation' => 'required|in:DELETE',
        ], [
            'confirmation.in' => 'Please type DELETE to confirm you want to permanently delete your account.',
        ]);

        $user = Auth::user();

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $this->purgeUserData($user);

        return redirect()->route('home')->with('success', 'Your account and all associated data have been permanently deleted.');
    }

    // ── API: Change password (mobile) ──────────────────────────────────────

    public function changePasswordApi(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'The current password you entered is incorrect.'], 422);
        }

        $user->forceFill(['password' => Hash::make($request->password)])->save();

        return response()->json(['message' => 'Password updated successfully.']);
    }

    // ── API: Delete account (mobile   Apple requirement) ───────────────────

    public function deleteAccountApi(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke all Sanctum tokens so existing mobile sessions are immediately invalidated
        $user->tokens()->delete();

        $this->purgeUserData($user);

        return response()->json(['message' => 'Account deleted. All data has been permanently removed.']);
    }

    // ── Shared: hard-delete all user data ─────────────────────────────────

    private function purgeUserData(object $user): void
    {
        DB::transaction(function () use ($user) {
            // Related data   delete in dependency order
            DB::table('user_push_tokens')->where('user_id', $user->id)->delete();
            DB::table('email_otps')->where('user_id', $user->id)->delete();
            DB::table('analytics_events')->where('user_id', $user->id)->delete();
            DB::table('subscriptions')->where('user_id', $user->id)->delete();
            DB::table('check_ins')->where('user_id', $user->id)->delete();
            DB::table('symptoms')->where('user_id', $user->id)->delete();
            DB::table('medications')->where('user_id', $user->id)->delete();
            DB::table('user_profiles')->where('user_id', $user->id)->delete();
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            DB::table('personal_access_tokens')
                ->where('tokenable_type', 'App\\Models\\User')
                ->where('tokenable_id', $user->id)
                ->delete();

            // Finally delete the user record
            DB::table('users')->where('id', $user->id)->delete();
        });
    }
}
