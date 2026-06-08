<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserProfile;
use App\Services\EmailOtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * End a guest demo session so the visitor can sign in or register.
     */
    private function endGuestSessionIfNeeded(Request $request): void
    {
        if (Auth::check() && session('is_web_guest')) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
    }

    /**
     * Show the login form
     */
    public function showLogin(Request $request)
    {
        if (Auth::check()) {
            if (session('is_web_guest')) {
                $this->endGuestSessionIfNeeded($request);
            } else {
                return redirect()->route('treatments');
            }
        }

        return view('auth.login');
    }

    /**
     * Handle login request
     */
    public function login(Request $request)
    {
        if (session('is_web_guest')) {
            $this->endGuestSessionIfNeeded($request);
        }

        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:6',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            $request->session()->forget('is_web_guest');

            return redirect()->route('treatments')->with('success', 'Welcome back!');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    /**
     * Show the registration form
     */
    public function showRegister(Request $request)
    {
        if (Auth::check()) {
            if (session('is_web_guest')) {
                $this->endGuestSessionIfNeeded($request);
            } else {
                return redirect()->route('treatments');
            }
        }

        return view('auth.register');
    }

    /**
     * Handle registration request
     */
    public function register(Request $request, EmailOtpService $otps)
    {
        if (session('is_web_guest')) {
            $this->endGuestSessionIfNeeded($request);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:40',
            'password' => 'required|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        Auth::login($user);
        $request->session()->forget('is_web_guest');
        if (! empty($validated['phone'])) {
            UserProfile::firstOrCreate(
                ['user_id' => $user->id],
                ['phone' => $validated['phone']]
            );
        }
        $otps->send($user, true);

        return redirect()->route('email.otp.show')->with('success', 'Account created. Check your email for a 6-digit verification code.');
    }

    /**
     * Handle logout
     * Supports optional ?to=register|login|home to redirect after sign-out.
     * Used by the guest banner so "Create account" lands on register.
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $allowed = ['login', 'register', 'home'];
        $to      = $request->input('redirect_to', 'login');
        $route   = in_array($to, $allowed) ? $to : 'login';

        return redirect()->route($route)->with('status', 'Logged out successfully.');
    }
}
