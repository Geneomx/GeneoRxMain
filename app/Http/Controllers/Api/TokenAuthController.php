<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserProfile;
use App\Notifications\ResetPasswordNotification;
use App\Services\EmailOtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TokenAuthController extends Controller
{
    public function register(Request $request, EmailOtpService $otps)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:40',
            'password' => 'required|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        if (! empty($validated['phone'])) {
            UserProfile::firstOrCreate(
                ['user_id' => $user->id],
                ['phone' => $validated['phone']]
            );
        }

        $token = $user->createToken('mobile')->plainTextToken;
        $otps->send($user, true);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'emailVerified' => false,
                'email_verified_at' => null,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->string('email'))->first();

        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('The provided credentials are incorrect.')],
            ]);
        }

        $user->tokens()->where('name', 'mobile')->delete();
        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'emailVerified' => (bool) $user->email_verified_at,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Send a password reset link to the given email address.
     * Always returns 200 to prevent email enumeration.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            // Throttle: one request per minute per email
            $recent = DB::table('password_reset_tokens')
                ->where('email', $user->email)
                ->where('created_at', '>=', Carbon::now()->subMinute())
                ->exists();

            if (! $recent) {
                DB::table('password_reset_tokens')->where('email', $user->email)->delete();

                $token = Str::random(64);

                DB::table('password_reset_tokens')->insert([
                    'email' => $user->email,
                    'token' => Hash::make($token),
                    'created_at' => Carbon::now(),
                ]);

                // Deep-link URL for mobile app   geneorx://reset?token=...&email=...
                $resetUrl = 'geneorx://reset?token='.urlencode($token).'&email='.urlencode($user->email);

                $user->notify(new ResetPasswordNotification($resetUrl));
            }
        }

        return response()->json([
            'ok' => true,
            'message' => 'If that address is registered, a reset link has been sent.',
        ]);
    }

    /**
     * Apply a new password given a valid reset token.
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (! $record || ! Hash::check($validated['token'], $record->token)) {
            throw ValidationException::withMessages([
                'token' => ['This reset link is invalid or has already been used.'],
            ]);
        }

        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            throw ValidationException::withMessages([
                'token' => ['This reset link has expired. Please request a new one.'],
            ]);
        }

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account found with that email address.'],
            ]);
        }

        $user->forceFill(['password' => Hash::make($validated['password'])])->save();

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        // Revoke old mobile tokens so they must log in with the new password
        $user->tokens()->where('name', 'mobile')->delete();

        return response()->json([
            'ok' => true,
            'message' => 'Password reset successfully. Please sign in with your new password.',
        ]);
    }
}
