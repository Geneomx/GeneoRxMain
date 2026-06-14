<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiSummaryService
{
    public function summarize(array $facts): ?string
    {
        $key = config('services.gemini.key');
        $model = config('services.gemini.model', 'gemini-2.0-flash');

        if (! $key) {
            return null;
        }

        $prompt = $this->buildPrompt($facts);

        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=".urlencode($key);

            $response = Http::timeout(25)
                ->post(
                    $url,
                    [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                        'generationConfig' => [
                            'temperature' => 0.4,
                            'maxOutputTokens' => 450,
                        ],
                    ],
                );

            if (! $response->successful()) {
                Log::warning('Gemini summary failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $text = data_get($response->json(), 'candidates.0.content.parts.0.text');

            return is_string($text) && trim($text) !== '' ? trim($text) : null;
        } catch (\Throwable $e) {
            Log::warning('Gemini summary error', ['message' => $e->getMessage()]);

            return null;
        }
    }

    private function buildPrompt(array $facts): string
    {
        $json = json_encode($facts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
You write short educational health summaries for GeneoRx.
Rules:
- Educational only. Do NOT diagnose, prescribe, or recommend doses.
- Use ONLY the facts in the JSON below. Do not invent nutrients, labs, diagnoses, or citations.
- Write 2-3 short paragraphs in plain language (under 130 words total).
- Paragraph 1: overview of medications and symptoms.
- Paragraph 2: what the GeneoRx insight may mean.
- Paragraph 3: 1-2 questions the user could ask their clinician.
- If language is "es", write in Spanish; otherwise English.
- End with exactly: "This is not medical advice."

Facts JSON:
{$json}
PROMPT;
    }
}
