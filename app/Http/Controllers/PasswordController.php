<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\View\View;

class PasswordController extends Controller
{
    // ── Step 1: Show the forgot-password form ──────────────────────────────

    public function showForgot(): View
    {
        return view('auth.forgot');
    }

    // ── Step 2: Send reset link ─────────────────────────────────────────────

    public function sendResetLink(Request $request): RedirectResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // Always show a success message to prevent email enumeration
        if (! $user) {
            return back()->with('status', 'If that address is registered, a reset link has been sent.');
        }

        // Throttle: one request per minute per email
        $recent = DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->where('created_at', '>=', Carbon::now()->subMinute())
            ->exists();

        if ($recent) {
            return back()->with('status', 'A reset link was sent recently. Please check your inbox or wait a moment before trying again.');
        }

        // Clear old tokens for this email and create a fresh one
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        $token = Str::random(64);

        DB::table('password_reset_tokens')->insert([
            'email'      => $user->email,
            'token'      => Hash::make($token),
            'created_at' => Carbon::now(),
        ]);

        $resetUrl = route('password.reset', [
            'token' => $token,
            'email' => $user->email,
        ]);

        $user->notify(new ResetPasswordNotification($resetUrl));

        return back()->with('status', 'If that address is registered, a reset link has been sent. Check your inbox.');
    }

    // ── Step 3: Show the reset-password form ──────────────────────────────

    public function showReset(Request $request, string $token): View
    {
        return view('auth.reset', [
            'token' => $token,
            'email' => $request->query('email', ''),
        ]);
    }

    // ── Step 4: Apply the new password ─────────────────────────────────────

    public function resetPassword(Request $request): RedirectResponse
    {
        $request->validate([
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (! $record || ! Hash::check($request->token, $record->token)) {
            return back()->withErrors(['token' => 'This reset link is invalid or has already been used.']);
        }

        // Links expire after 60 minutes
        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return back()->withErrors(['token' => 'This reset link has expired. Please request a new one.']);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return back()->withErrors(['email' => 'No account found with that email address.']);
        }

        $user->forceFill(['password' => Hash::make($request->password)])->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return redirect()->route('login')->with('success', 'Password reset successfully. Sign in with your new password.');
    }
}
