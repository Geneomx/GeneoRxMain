<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Api\AiSummaryController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AssistantController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\EmailOtpController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\PushTokenController;
use App\Http\Controllers\Api\SocialAuthController as ApiSocialAuthController;
use App\Http\Controllers\Api\TokenAuthController;
use App\Http\Controllers\HomeController;
use App\Models\Medication;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [TokenAuthController::class, 'register']);
Route::post('/auth/login', [TokenAuthController::class, 'login']);
Route::post('/auth/email-otp/send', [EmailOtpController::class, 'send'])->middleware('throttle:5,1');
Route::post('/auth/email-otp/verify', [EmailOtpController::class, 'verify'])->middleware('throttle:10,1');

// Password reset (unauthenticated   user doesn't have a token yet)
Route::post('/auth/forgot-password', [TokenAuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/auth/reset-password', [TokenAuthController::class, 'resetPassword'])->middleware('throttle:10,1');

// ── Social login (unauthenticated   mobile native flows) ───────────────────
// Google: sends { access_token } obtained via expo-auth-session
// Apple:  sends { identity_token, email?, name? } from expo-apple-authentication
Route::post('/auth/social/google', [ApiSocialAuthController::class, 'google'])->middleware('throttle:10,1');
Route::post('/auth/social/apple', [ApiSocialAuthController::class, 'apple'])->middleware('throttle:10,1');

Route::get('/medications/catalog', function () {
    return response()->json(['catalog' => Medication::toMedDb()]);
});

Route::post('/mobile/ai-summary', AiSummaryController::class)->middleware('throttle:10,1');

// Ask GeneoRx conversational assistant (guest-friendly; bearer attaches the
// user's own grounding context).
Route::post('/mobile/assistant', AssistantController::class)
    ->middleware('throttle:20,1');

// ── Product analytics + feedback (guest-friendly; bearer token attaches user) ─
Route::post('/analytics/track', [AnalyticsController::class, 'track'])
    ->middleware('throttle:60,1');
Route::post('/feedback', [FeedbackController::class, 'store'])
    ->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [TokenAuthController::class, 'logout']);
    Route::get('/mobile/profile', [HomeController::class, 'getProfile']);
    Route::post('/mobile/profile', [HomeController::class, 'saveProfile']);
    Route::post('/mobile/push-token', [PushTokenController::class, 'store']);
    Route::delete('/mobile/push-token', [PushTokenController::class, 'destroy']);

    // ── Doctors: directory, async questions, appointment requests ─────────
    // Signed-in only, unlike feedback: a question to a named clinician needs an
    // account to reply to.
    Route::get('/mobile/doctors', [DoctorController::class, 'index']);
    Route::get('/mobile/doctor-messages', [DoctorController::class, 'messages']);
    Route::post('/mobile/doctor-messages', [DoctorController::class, 'storeMessage'])
        ->middleware('throttle:10,1');
    Route::get('/mobile/appointments', [DoctorController::class, 'appointments']);
    Route::post('/mobile/appointments', [DoctorController::class, 'storeAppointment'])
        ->middleware('throttle:10,1');

    // Account management (Apple requires in-app account deletion)
    Route::put('/account/password', [AccountController::class, 'changePasswordApi']);
    Route::delete('/account', [AccountController::class, 'deleteAccountApi']);
});
