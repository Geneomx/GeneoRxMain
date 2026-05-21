<?php

namespace App\Services;

use App\Models\EmailOtp;
use App\Models\User;
use App\Notifications\EmailOtpNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class EmailOtpService
{
    public function send(User $user, bool $force = false): EmailOtp
    {
        $latest = EmailOtp::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (! $force && $latest?->last_sent_at && $latest->last_sent_at->gt(now()->subSeconds(45))) {
            throw ValidationException::withMessages([
                'email' => 'Please wait before requesting another verification code.',
            ]);
        }

        $code = (string) random_int(100000, 999999);

        $otp = EmailOtp::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'last_sent_at' => now(),
        ]);

        $user->notify(new EmailOtpNotification($code));

        return $otp;
    }

    public function verify(User $user, string $code): void
    {
        $otp = EmailOtp::where('user_id', $user->id)
            ->where('email', $user->email)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (! $otp) {
            throw ValidationException::withMessages(['code' => 'Request a verification code first.']);
        }

        if ($otp->expires_at->isPast()) {
            throw ValidationException::withMessages(['code' => 'This code expired. Request a new code.']);
        }

        if ($otp->attempts >= 5) {
            throw ValidationException::withMessages(['code' => 'Too many attempts. Request a new code.']);
        }

        $otp->increment('attempts');

        if (! Hash::check($code, $otp->code_hash)) {
            throw ValidationException::withMessages(['code' => 'The verification code is incorrect.']);
        }

        $otp->update(['verified_at' => now()]);
        $user->forceFill(['email_verified_at' => now()])->save();
    }
}
