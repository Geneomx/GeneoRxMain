<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Social provider name: 'google' | 'apple'
            $table->string('social_provider')->nullable()->after('password');
            // Provider's unique user ID (Google sub / Apple sub)
            $table->string('social_provider_id')->nullable()->after('social_provider');
            // Composite index for fast provider lookups
            $table->index(['social_provider', 'social_provider_id'], 'users_social_provider_idx');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_social_provider_idx');
            $table->dropColumn(['social_provider', 'social_provider_id']);
        });
    }
};
