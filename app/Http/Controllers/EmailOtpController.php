<?php

namespace App\Http\Controllers;

use App\Services\EmailOtpService;
use Illuminate\Http\Request;

class EmailOtpController extends Controller
{
    public function show(Request $request)
    {
        return view('auth.verify-email-code', ['email' => $request->user()->email]);
    }

    public function resend(Request $request, EmailOtpService $otps)
    {
        $otps->send($request->user());

        return back()->with('success', 'A new verification code was sent to your email.');
    }

    public function verify(Request $request, EmailOtpService $otps)
    {
        $validated = $request->validate(['code' => 'required|digits:6']);

        $otps->verify($request->user(), $validated['code']);

        return redirect()->route('treatments')->with('success', 'Email verified. Welcome to GeneoRx.');
    }
}
