<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminMedicationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\EmailOtpController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\SocialAuthController;
use App\Http\Controllers\StripeWebhookController;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
Route::get('/guest', [GuestController::class, 'begin'])->name('guest');

// ── Social OAuth (Google + Apple) ──────────────────────────────────────────
// Google uses standard GET redirect flow
Route::get('/auth/google', [SocialAuthController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');

// Apple sends a POST to the callback (no CSRF   excluded in bootstrap/app.php)
Route::get('/auth/apple', [SocialAuthController::class, 'redirectToApple'])->name('auth.apple');
Route::post('/auth/apple/callback', [SocialAuthController::class, 'handleAppleCallback'])->name('auth.apple.callback');

// Password reset
Route::get('/forgot-password', [PasswordController::class, 'showForgot'])->name('password.request');
Route::post('/forgot-password', [PasswordController::class, 'sendResetLink'])->name('password.email');
Route::get('/reset-password/{token}', [PasswordController::class, 'showReset'])->name('password.reset');
Route::post('/reset-password', [PasswordController::class, 'resetPassword'])->name('password.update');
Route::post('/stripe/webhook', StripeWebhookController::class)->name('stripe.webhook');

Route::get('/', [HomeController::class, 'index'])->name('home');

// Legal pages
Route::get('/legal/privacy', [LegalController::class, 'privacy'])->name('legal.privacy');
Route::get('/legal/terms', [LegalController::class, 'terms'])->name('legal.terms');

// Protected routes (require authentication)
Route::middleware('auth')->group(function () {
    Route::get('/email/verify-code', [EmailOtpController::class, 'show'])->name('email.otp.show');
    Route::post('/email/verify-code', [EmailOtpController::class, 'verify'])->name('email.otp.verify');
    Route::post('/email/verify-code/resend', [EmailOtpController::class, 'resend'])->name('email.otp.resend');
    Route::get('/billing', [BillingController::class, 'show'])->name('billing.show');
    Route::post('/billing/checkout', [BillingController::class, 'checkout'])->name('billing.checkout');
    Route::post('/billing/portal', [BillingController::class, 'portal'])->name('billing.portal');

    Route::get('/treatments', [HomeController::class, 'treatment'])->name('treatments');

    // API routes for profile
    Route::get('/api/profile', [HomeController::class, 'getProfile'])->name('api.profile.get');
    Route::post('/api/profile', [HomeController::class, 'saveProfile'])->name('api.profile.save');

    // Account settings
    Route::get('/account/settings', [AccountController::class, 'settings'])->name('account.settings');
    Route::put('/account/password', [AccountController::class, 'changePassword'])->name('account.password');
    Route::delete('/account', [AccountController::class, 'deleteAccount'])->name('account.delete');
});

// Admin routes (require auth + is_admin)
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/analytics', [AdminController::class, 'analytics'])->name('analytics');
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::get('/users/export', [AdminController::class, 'exportUsers'])->name('users.export');
    Route::get('/users/create', [AdminController::class, 'createUser'])->name('users.create');
    Route::post('/users', [AdminController::class, 'storeUser'])->name('users.store');
    Route::get('/users/{user}', [AdminController::class, 'userDetail'])->name('user-detail');

    Route::post('/users/{user}/grant-plus', [AdminController::class, 'grantPlus'])->name('grant-plus');
    Route::delete('/users/{user}/grant-plus', [AdminController::class, 'revokePlus'])->name('revoke-plus');
    Route::post('/users/{user}/verify-email', [AdminController::class, 'verifyEmail'])->name('verify-email');
    Route::put('/users/{user}', [AdminController::class, 'updateUser'])->name('update-user');
    Route::post('/users/{user}/toggle-admin', [AdminController::class, 'toggleAdmin'])->name('toggle-admin');
    Route::post('/users/{user}/send-reset', [AdminController::class, 'sendPasswordReset'])->name('send-reset');
    Route::post('/users/{user}/set-password', [AdminController::class, 'setPassword'])->name('set-password');
    Route::delete('/users/{user}', [AdminController::class, 'deleteUser'])->name('delete-user');
    Route::get('/subscriptions', [AdminController::class, 'subscriptions'])->name('subscriptions');

    // ── Medications CRUD ──────────────────────────────────────────────────────
    Route::get('/medications', [AdminMedicationController::class, 'index'])->name('medications');
    Route::get('/medications/create', [AdminMedicationController::class, 'create'])->name('medications.create');
    Route::post('/medications', [AdminMedicationController::class, 'store'])->name('medications.store');
    Route::get('/medications/{medication}/edit', [AdminMedicationController::class, 'edit'])->name('medications.edit');
    Route::put('/medications/{medication}', [AdminMedicationController::class, 'update'])->name('medications.update');
    Route::post('/medications/{medication}/toggle', [AdminMedicationController::class, 'toggle'])->name('medications.toggle');
    Route::delete('/medications/{medication}', [AdminMedicationController::class, 'destroy'])->name('medications.destroy');
});
