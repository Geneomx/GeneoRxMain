<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Repairs accounts damaged by a mass-assignment bug: `email_verified_at` was
 * missing from User::$fillable, so every Google/Apple sign-up silently failed
 * to persist it and stayed unverified forever.
 *
 * These accounts ARE verified — the identity provider confirmed the address
 * before we ever created the row — so the flag is restored to the account's
 * creation time rather than "now", which would misrepresent when verification
 * actually happened.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNotNull('social_provider_id')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        // Deliberately irreversible: once backfilled there is no way to tell a
        // repaired row from an account that verified normally, and clearing
        // both would sign real users out of a verified state.
    }
};
