<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminDoctorController;
use App\Http\Controllers\AdminMedicationController;
use App\Http\Controllers\Api\AiSummaryController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AssistantController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClinicController;
use App\Http\Controllers\DoctorPortalController;
use App\Http\Controllers\EmailOtpController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\SocialAuthController;
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

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/treatments', [HomeController::class, 'treatment'])->name('treatments');

// Portal analytics + feedback (guest-friendly: works with or without a session)
Route::post('/api/track', [AnalyticsController::class, 'track'])
    ->middleware('throttle:60,1')->name('api.track');
Route::post('/api/feedback', [FeedbackController::class, 'store'])
    ->middleware('throttle:10,1')->name('api.feedback');

// Ask GeneoRx assistant (same handler as the mobile API; session-authed here).
Route::post('/api/assistant', AssistantController::class)
    ->middleware('throttle:20,1')->name('api.assistant');

// AI summary — powers the doctor-report AI visit summary (and the weekly digest).
Route::post('/api/ai-summary', AiSummaryController::class)
    ->middleware('throttle:10,1')->name('api.ai-summary');

// Legal pages
Route::get('/legal/privacy', [LegalController::class, 'privacy'])->name('legal.privacy');
Route::get('/legal/terms', [LegalController::class, 'terms'])->name('legal.terms');

// Protected routes (require authentication)
Route::middleware('auth')->group(function () {
    Route::get('/email/verify-code', [EmailOtpController::class, 'show'])->name('email.otp.show');
    Route::post('/email/verify-code', [EmailOtpController::class, 'verify'])->name('email.otp.verify');
    Route::post('/email/verify-code/resend', [EmailOtpController::class, 'resend'])->name('email.otp.resend');

    Route::get('/api/profile', [HomeController::class, 'getProfile'])->name('api.profile.get');
    Route::post('/api/profile', [HomeController::class, 'saveProfile'])->name('api.profile.save');

    // Ask a doctor — the web twin of the mobile screen. A guest session is
    // signed in as the shared guest account, so it reaches these; the
    // controller shows it a sign-in card and refuses the writes.
    Route::get('/doctor', [DoctorPortalController::class, 'index'])->name('doctor');
    Route::get('/doctor/slots', [DoctorPortalController::class, 'slots'])->name('doctor.slots');
    Route::post('/doctor/messages', [DoctorPortalController::class, 'storeMessage'])
        ->middleware('throttle:10,1')->name('doctor.message');
    Route::post('/doctor/messages/{message}/reply', [DoctorPortalController::class, 'replyToThread'])
        ->middleware('throttle:20,1')->name('doctor.message.reply');
    Route::post('/doctor/appointments', [DoctorPortalController::class, 'storeAppointment'])
        ->middleware('throttle:10,1')->name('doctor.appointment');

    // Account settings
    Route::get('/account/settings', [AccountController::class, 'settings'])->name('account.settings');
    Route::put('/account/password', [AccountController::class, 'changePassword'])->name('account.password');
    Route::delete('/account', [AccountController::class, 'deleteAccount'])->name('account.delete');
});

// Admin routes (require auth + is_admin)
// ── The clinician's own portal ─────────────────────────────────────────────
// Registered doctors only: their appointments and their conversations, never
// anybody else's. Separate from /admin, which is the business's own panel.
Route::middleware(['auth', 'doctor'])->prefix('clinic')->name('clinic.')->group(function () {
    Route::get('/', [ClinicController::class, 'appointments'])->name('appointments');
    Route::post('/appointments/{appointment}', [ClinicController::class, 'respondAppointment'])->name('appointments.respond');
    Route::get('/messages', [ClinicController::class, 'messages'])->name('messages');
    Route::get('/messages/{message}', [ClinicController::class, 'thread'])->name('thread');
    Route::post('/messages/{message}/reply', [ClinicController::class, 'reply'])
        ->middleware('throttle:30,1')->name('thread.reply');
    Route::post('/messages/{message}/close', [ClinicController::class, 'closeThread'])->name('thread.close');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/analytics', [AdminController::class, 'analytics'])->name('analytics');
    Route::get('/analytics/export', [AdminController::class, 'exportAnalytics'])->name('analytics.export');

    // ── Feedback inbox ────────────────────────────────────────────────────────
    Route::get('/feedback', [AdminController::class, 'feedback'])->name('feedback');
    Route::post('/feedback/{feedback}/status', [AdminController::class, 'updateFeedbackStatus'])->name('feedback.status');

    // ── Subscriptions ─────────────────────────────────────────────────────────
    Route::get('/subscriptions', [AdminController::class, 'subscriptions'])->name('subscriptions');

    // ── Audit log ─────────────────────────────────────────────────────────────
    Route::get('/audit', [AdminController::class, 'audit'])->name('audit');

    // ── Roles ─────────────────────────────────────────────────────────────────
    Route::post('/users/{user}/role', [AdminController::class, 'setRole'])->name('set-role');
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::get('/users/export', [AdminController::class, 'exportUsers'])->name('users.export');
    Route::get('/users/create', [AdminController::class, 'createUser'])->name('users.create');
    Route::post('/users', [AdminController::class, 'storeUser'])->name('users.store');
    Route::get('/users/{user}', [AdminController::class, 'userDetail'])->name('user-detail');

    Route::post('/users/{user}/verify-email', [AdminController::class, 'verifyEmail'])->name('verify-email');
    Route::put('/users/{user}', [AdminController::class, 'updateUser'])->name('update-user');
    Route::post('/users/{user}/toggle-admin', [AdminController::class, 'toggleAdmin'])->name('toggle-admin');
    Route::post('/users/{user}/send-reset', [AdminController::class, 'sendPasswordReset'])->name('send-reset');
    Route::post('/users/{user}/set-password', [AdminController::class, 'setPassword'])->name('set-password');
    Route::delete('/users/{user}', [AdminController::class, 'deleteUser'])->name('delete-user');

    // ── Doctors + consults ────────────────────────────────────────────────────
    // Doctors are registered here and nowhere else: there is no self-registration
    // route, because listing someone as a clinician is a claim we are making.
    Route::get('/doctors', [AdminDoctorController::class, 'index'])->name('doctors');
    Route::post('/doctors', [AdminDoctorController::class, 'store'])->name('doctors.store');
    Route::put('/doctors/{doctor}', [AdminDoctorController::class, 'update'])->name('doctors.update');
    Route::post('/doctors/{doctor}/toggle', [AdminDoctorController::class, 'toggleActive'])->name('doctors.toggle');
    Route::post('/doctors/{doctor}/login', [AdminDoctorController::class, 'createLogin'])->name('doctors.login');
    Route::delete('/doctors/{doctor}/login', [AdminDoctorController::class, 'revokeLogin'])->name('doctors.login.revoke');

    Route::get('/consults', [AdminDoctorController::class, 'inbox'])->name('consults');
    Route::post('/consults/messages/{message}/reply', [AdminDoctorController::class, 'reply'])->name('consults.reply');
    Route::post('/consults/messages/{message}/close', [AdminDoctorController::class, 'closeMessage'])->name('consults.close');
    Route::post('/consults/appointments/{appointment}/respond', [AdminDoctorController::class, 'respondAppointment'])->name('consults.respond');

    // ── Medications CRUD ──────────────────────────────────────────────────────
    Route::get('/medications', [AdminMedicationController::class, 'index'])->name('medications');
    Route::get('/medications/create', [AdminMedicationController::class, 'create'])->name('medications.create');
    Route::post('/medications', [AdminMedicationController::class, 'store'])->name('medications.store');
    Route::get('/medications/{medication}/edit', [AdminMedicationController::class, 'edit'])->name('medications.edit');
    Route::put('/medications/{medication}', [AdminMedicationController::class, 'update'])->name('medications.update');
    Route::post('/medications/{medication}/toggle', [AdminMedicationController::class, 'toggle'])->name('medications.toggle');
    Route::delete('/medications/{medication}', [AdminMedicationController::class, 'destroy'])->name('medications.destroy');
});
