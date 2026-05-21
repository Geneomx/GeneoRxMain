<?php

use App\Models\Subscription;
use App\Models\User;
use App\Models\UserPushToken;
use App\Notifications\BillingStatusNotification;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Scheduled tasks ────────────────────────────────────────────────────────
Schedule::command('geneorx:prune-push-tokens')->daily();
Schedule::command('geneorx:send-checkin-reminders')->weekly()->sundays()->at('09:00');

Artisan::command('geneorx:send-checkin-reminders', function () {
    $tokens = UserPushToken::query()
        ->whereNull('disabled_at')
        ->whereHas('user.profile', function ($query) {
            $query->where('portal_state->reminderPreferences->enabled', true);
        })
        ->get();

    foreach ($tokens as $token) {
        Http::post('https://exp.host/--/api/v2/push/send', [
            'to' => $token->expo_push_token,
            'title' => 'GeneoRx weekly check-in',
            'body' => 'Track symptoms, adherence, energy, mood, sleep, and focus.',
            'data' => ['screen' => 'checkin'],
        ]);
    }

    $this->info("Sent {$tokens->count()} GeneoRx check-in reminders.");
})->purpose('Send GeneoRx weekly check-in push reminders');

Artisan::command('geneorx:grant-plus {email} {--days=30} {--reason=Support override}', function () {
    $user = User::where('email', $this->argument('email'))->first();
    if (! $user) {
        $this->error('User not found.');

        return self::FAILURE;
    }

    $days = max(1, (int) $this->option('days'));
    Subscription::updateOrCreate(
        ['user_id' => $user->id],
        [
            'plan' => 'plus',
            'status' => 'active',
            'provider' => 'admin',
            'admin_override_ends_at' => now()->addDays($days),
            'admin_override_reason' => (string) $this->option('reason'),
        ]
    );

    $this->info("Granted Plus to {$user->email} for {$days} days.");

    return self::SUCCESS;
})->purpose('Grant temporary GeneoRx Plus access for support/testing');

Artisan::command('geneorx:prune-push-tokens', function () {
    // Hard-delete push token rows that have been disabled for more than 30 days.
    // Expo TTL-expires tokens after ~90 days but we clean them proactively to keep
    // the table lean and avoid sending to stale devices.
    $cutoff = now()->subDays(30);

    $count = UserPushToken::whereNotNull('disabled_at')
        ->where('disabled_at', '<', $cutoff)
        ->delete();

    $this->info("Pruned {$count} expired push token(s) (disabled before {$cutoff->toDateString()}).");
})->purpose('Remove push tokens disabled more than 30 days ago');

Artisan::command('geneorx:send-trial-ending-notices', function () {
    $subscriptions = Subscription::query()
        ->with('user')
        ->where('status', 'trialing')
        ->whereBetween('trial_ends_at', [now(), now()->addDays(2)])
        ->get();

    foreach ($subscriptions as $subscription) {
        $subscription->user?->notify(new BillingStatusNotification(
            'GeneoRx Plus trial ending soon',
            'Your Plus trial is ending soon. You can manage billing or cancel from your GeneoRx billing page.'
        ));
    }

    $this->info("Sent {$subscriptions->count()} trial ending notices.");
})->purpose('Send GeneoRx Plus trial ending notices');

// ── Admin user management ───────────────────────────────────────────────────
Artisan::command(
    'geneorx:make-admin {email} {--name=} {--password=} {--create}',
    function () {
        $email = $this->argument('email');

        // ── CREATE new user and make them admin ──────────────────────────────
        if ($this->option('create')) {
            if (User::where('email', $email)->exists()) {
                $this->error("A user with e-mail [{$email}] already exists. Omit --create to promote them.");

                return self::FAILURE;
            }

            $name = $this->option('name') ?: $this->ask('Full name');
            $password = $this->option('password') ?: $this->secret('Password (min 8 chars)');

            if (strlen($password) < 8) {
                $this->error('Password must be at least 8 characters.');

                return self::FAILURE;
            }

            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'is_admin' => true,
                'email_verified_at' => now(),
            ]);

            $this->info('✅  Admin user created:');
            $this->line("    Name  : {$user->name}");
            $this->line("    Email : {$user->email}");
            $this->line("    ID    : {$user->id}");

            return self::SUCCESS;
        }

        // ── PROMOTE existing user to admin ───────────────────────────────────
        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("No user found with e-mail [{$email}].");
            $this->line('Tip: use --create to make a brand-new admin account.');

            return self::FAILURE;
        }

        if ($user->is_admin) {
            $this->warn("{$user->name} ({$email}) is already an admin. No changes made.");

            return self::SUCCESS;
        }

        $user->update(['is_admin' => true]);
        $this->info("✅  [{$user->name}] has been promoted to admin.");

        return self::SUCCESS;
    }
)->purpose('Create a new admin user or promote an existing user to admin');

Artisan::command('geneorx:remove-admin {email}', function () {
    $email = $this->argument('email');
    $user = User::where('email', $email)->first();

    if (! $user) {
        $this->error("No user found with e-mail [{$email}].");

        return self::FAILURE;
    }

    if (! $user->is_admin) {
        $this->warn("{$user->name} ({$email}) is not an admin. No changes made.");

        return self::SUCCESS;
    }

    $user->update(['is_admin' => false]);
    $this->info("✅  Admin access removed from [{$user->name}].");

    return self::SUCCESS;
})->purpose('Remove admin access from a user');

Artisan::command('geneorx:list-admins', function () {
    $admins = User::where('is_admin', true)->orderBy('name')->get(['id', 'name', 'email', 'created_at']);

    if ($admins->isEmpty()) {
        $this->warn('No admin users found.');

        return self::SUCCESS;
    }

    $this->table(['ID', 'Name', 'Email', 'Joined'], $admins->map(fn ($u) => [
        $u->id,
        $u->name,
        $u->email,
        $u->created_at->format('Y-m-d'),
    ])->toArray());

    return self::SUCCESS;
})->purpose('List all admin users');
