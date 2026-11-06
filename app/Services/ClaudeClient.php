<?php

namespace App\Services;

use Anthropic\Client;
use Illuminate\Support\Facades\Log;

/**
 * One place that talks to the Claude Messages API for every GeneoRx AI feature
 * (assistant, summary, symptom ordering). Returns null on any failure so each
 * caller degrades to its own non-AI fallback.
 */
class ClaudeClient
{
    public static function configured(): bool
    {
        $key = config('services.anthropic.key');

        return is_string($key) && $key !== '' && $key !== '0';
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages  oldest-first; the first turn must be the user's
     */
    public function text(string $system, array $messages, int $maxTokens = 2000, float $timeout = 30.0, ?string $model = null): ?string
    {
        // The Messages API needs the first turn to come from the user.
        $messages = array_values($messages);
        while ($messages !== [] && ($messages[0]['role'] ?? 'user') !== 'user') {
            array_shift($messages);
        }
        if (! self::configured() || $messages === []) {
            return null;
        }

        try {
            // Short ceiling and one retry: a phone is waiting on this request.
            $client = new Client(
                apiKey: (string) config('services.anthropic.key'),
                requestOptions: ['timeout' => $timeout, 'maxRetries' => 1],
            );
            $response = $client->messages->create(
                model: $model ?: (string) config('services.anthropic.model'),
                maxTokens: $maxTokens,
                system: $system,
                messages: array_map(fn ($m) => [
                    'role' => ($m['role'] ?? 'user') === 'user' ? 'user' : 'assistant',
                    'content' => (string) ($m['content'] ?? ''),
                ], $messages),
                outputConfig: ['effort' => (string) config('services.anthropic.effort', 'low')],
            );
        } catch (\Throwable $e) {
            // Class name only: exception text can carry credentials or the user's own words.
            Log::notice('Claude request unavailable', ['error' => $e::class]);

            return null;
        }

        if ($response->stopReason === 'refusal') {
            return null;
        }

        $text = '';
        foreach ($response->content as $block) {
            if ($block->type === 'text') {
                $text .= $block->text;
            }
        }

        return trim($text) !== '' ? trim($text) : null;
    }
}
