<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserPushToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends Expo push notifications.
 *
 * Until now the app registered a push token, the server stored it, and nothing
 * ever sent anything — so a doctor's reply sat unseen until the patient next
 * opened the app. This is the missing half.
 *
 * Deliberately sent inline rather than queued: production runs
 * QUEUE_CONNECTION=database and there is no guarantee a worker is running on
 * the host, so a queued notification could sit in the jobs table forever. The
 * call is given a short timeout and every failure is swallowed and logged —
 * a push that does not go out must never break the reply that triggered it.
 */
class PushService
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    /** Expo's own cap per request. */
    private const CHUNK = 100;

    /**
     * Notify one person on every device they still have registered.
     *
     * @param  array<string, mixed>  $data  Delivered to the app, used to route the tap.
     */
    public function toUser(?User $user, string $title, string $body, array $data = []): void
    {
        if (! $user) {
            return;
        }

        $tokens = UserPushToken::where('user_id', $user->id)
            ->whereNull('disabled_at')
            ->pluck('expo_push_token')
            ->all();

        $this->send($tokens, $title, $body, $data);
    }

    /**
     * @param  array<int, string>  $tokens
     * @param  array<string, mixed>  $data
     */
    public function send(array $tokens, string $title, string $body, array $data = []): void
    {
        $tokens = array_values(array_unique(array_filter($tokens)));
        if ($tokens === []) {
            return;
        }

        foreach (array_chunk($tokens, self::CHUNK) as $chunk) {
            $messages = array_map(fn (string $to) => [
                'to' => $to,
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'sound' => 'default',
            ], $chunk);

            try {
                $response = Http::timeout(5)
                    ->acceptJson()
                    ->asJson()
                    ->post(self::ENDPOINT, $messages);

                if (! $response->successful()) {
                    Log::warning('Push send failed', ['status' => $response->status()]);

                    continue;
                }

                $this->retireDeadTokens($chunk, (array) $response->json('data', []));
            } catch (\Throwable $e) {
                // Never let a notification take down the action that caused it.
                Log::warning('Push send error', ['message' => $e->getMessage()]);
            }
        }
    }

    /**
     * A token for an app that has been deleted keeps failing forever, so Expo
     * tells us and we stop using it.
     *
     * @param  array<int, string>  $tokens  In the same order as the receipts.
     * @param  array<int, mixed>  $receipts
     */
    private function retireDeadTokens(array $tokens, array $receipts): void
    {
        $dead = [];

        foreach ($receipts as $i => $receipt) {
            $receipt = (array) $receipt;
            $error = $receipt['details']['error'] ?? null;
            if (($receipt['status'] ?? null) === 'error' && $error === 'DeviceNotRegistered' && isset($tokens[$i])) {
                $dead[] = $tokens[$i];
            }
        }

        if ($dead !== []) {
            UserPushToken::whereIn('expo_push_token', $dead)->update(['disabled_at' => now()]);
        }
    }
}
