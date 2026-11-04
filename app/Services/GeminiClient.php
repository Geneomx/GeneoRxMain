<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiClient
{
    /** Bounded failover, with credentials in a header and no prompt/body logging. */
    public function generate(array $payload, int $timeout = 12): ?array
    {
        $key = config('services.gemini.key');
        if (! $key || $key === '0') {
            return null;
        }
        $models = array_slice(array_values(array_unique(array_filter([
            config('services.gemini.model'),
            ...explode(',', config('services.gemini.fallback_models', '')),
        ]))), 0, 3);
        $deadline = microtime(true) + $timeout;
        foreach ($models as $model) {
            if (! preg_match('/^[a-zA-Z0-9._-]+$/', $model)) {
                continue;
            }
            $remaining = (int) floor($deadline - microtime(true));
            if ($remaining < 1) {
                break;
            }
            try {
                $response = Http::connectTimeout(min(4, $remaining))->timeout($remaining)
                    ->withHeaders(['x-goog-api-key' => $key])
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", $payload);
                if ($response->successful()) {
                    return $response->json();
                }
                Log::notice('Gemini request unavailable', ['status' => $response->status(), 'model' => $model]);
                if (! in_array($response->status(), [404, 429, 500, 502, 503, 504], true)) {
                    break;
                }
            } catch (\Throwable) {
                // No exception strings: HTTP exceptions can include credentials or user content.
                break;
            }
        }

        return null;
    }
}
