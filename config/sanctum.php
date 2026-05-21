<?php

use Laravel\Sanctum\Sanctum;

return [

    /*
    | Domains that receive "stateful" Sanctum cookies (e.g. first-party web SPA
    | using session + same-site cookies). The mobile app uses bearer tokens
    | and is not stateful, but the web /api/profile fetch still benefits when
    | these list your app hostnames in production. Set SANCTUM_STATEFUL_DOMAINS
    | explicitly in production (no spaces), e.g. myapp.com,www.myapp.com
    */
    'stateful' => explode(
        ',',
        (string) (env('SANCTUM_STATEFUL_DOMAINS') ?: 'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1'
            . (env('APP_URL') ? ','.parse_url((string) env('APP_URL'), PHP_URL_HOST) : ''))
    ),

    'guard' => ['web'],

    'expiration' => null,

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],
];
