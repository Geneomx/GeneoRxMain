<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'plus_price_id' => env('STRIPE_PLUS_PRICE_ID'),
    ],

    /*
    |----------------------------------------------------------------------
    | Google OAuth (Sign in with Google)
    |----------------------------------------------------------------------
    | Web redirect URL is /auth/google/callback.
    | Mobile uses its own client IDs for native sign-in via expo-auth-session.
    */
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('APP_URL').'/auth/google/callback',
    ],

    /*
    |----------------------------------------------------------------------
    | Apple Sign In (Sign in with Apple)
    |----------------------------------------------------------------------
    | Web flow uses Socialite + the SocialiteProviders/Apple package.
    | Mobile uses expo-apple-authentication (native iOS only).
    |
    | APPLE_CLIENT_ID   → your Services ID, e.g. com.geneorx.web
    | APPLE_CLIENT_SECRET → pre-generated signed JWT (see docs/apple-setup.md)
    | APPLE_BUNDLE_ID   → iOS app Bundle ID, e.g. com.geneorx.app
    |                     (used to verify identity tokens from the mobile app)
    */
    'apple' => [
        'client_id' => env('APPLE_CLIENT_ID'),
        'client_secret' => env('APPLE_CLIENT_SECRET'),
        'redirect' => env('APP_URL').'/auth/apple/callback',
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-2.5-flash-lite'),
    ],

];
