<?php

return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => (function () {
        $raw = env('CORS_ALLOWED_ORIGINS');
        if ($raw === null || $raw === '') {
            // Local: permissive. Set CORS_ALLOWED_ORIGINS in production.
            return ['*'];
        }
        if (trim($raw) === '*') {
            return ['*'];
        }

        return array_values(
            array_filter(
                array_map('trim', explode(',', $raw))
            )
        );
    })(),

    'allowed_origins_patterns' => array_values(
        array_filter(
            array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGIN_PATTERNS', '')))
        )
    ),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => (bool) env('CORS_SUPPORTS_CREDENTIALS', false),

];
