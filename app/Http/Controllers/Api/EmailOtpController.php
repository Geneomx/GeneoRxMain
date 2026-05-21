<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\EmailOtpService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EmailOtpController extends Controller
{
    public function send(Request $request, EmailOtpService $otps)
    {
        $validated = $request->validate(['email' => 'required|email']);
        $user = $request->user() ?: User::where('email', $validated['email'])->first();

        if ($user) {
            $otps->send($user);
        }

        return response()->json([
            'ok' => true,
            'message' => 'If this email has an account, a verification code has been sent.',
        ]);
    }

    public function verify(Request $request, EmailOtpService $otps)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'code' => 'required|digits:6',
        ]);

        $user = $request->user() ?: User::where('email', $validated['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages(['code' => 'The verification code is incorrect.']);
        }

        $otps->verify($user, $validated['code']);

        return response()->json([
            'ok' => true,
            'emailVerified' => true,
            'email_verified_at' => $user->fresh()->email_verified_at?->toIso8601String(),
        ]);
    }
}
