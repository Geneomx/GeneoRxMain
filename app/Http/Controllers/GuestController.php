<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class GuestController extends Controller
{
    /**
     * Start a guest demo session.
     *
     * Finds (or lazily creates) a shared guest account, logs the visitor in
     * for this session only (no "remember me"), and tags the session so we can
     * skip data writes and show the guest banner in the UI.
     */
    public function begin(): RedirectResponse
    {
        $guest = User::firstOrCreate(
            ['email' => 'guest@geneorx.local'],
            [
                'name' => 'Guest',
                'password' => bcrypt(Str::random(40)),
                'email_verified_at' => now(),
            ]
        );

        // Session-only login   closes automatically when the browser is shut
        Auth::login($guest, remember: false);

        // Tag this session so controllers/views can tell it's a guest demo
        session(['is_web_guest' => true]);

        return redirect()->route('treatments');
    }
}
