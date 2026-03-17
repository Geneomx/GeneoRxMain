<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\AuthController;

// Authentication routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::get('/', [HomeController::class, 'index'])->name('home');

// Protected routes (require authentication)
Route::middleware('auth')->group(function () {
    Route::get('/treatments', [HomeController::class, 'treatment'])->name('treatments');
    
    // API routes for profile
    Route::get('/api/profile', [HomeController::class, 'getProfile'])->name('api.profile.get');
    Route::post('/api/profile', [HomeController::class, 'saveProfile'])->name('api.profile.save');
});

