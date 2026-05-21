<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('user_profiles', 'portal_state')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->json('portal_state')->nullable();
            });
        }

        if (! Schema::hasColumn('check_ins', 'data')) {
            Schema::table('check_ins', function (Blueprint $table) {
                $table->json('data')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('user_profiles', 'portal_state')) {
                $table->dropColumn('portal_state');
            }
        });
        Schema::table('check_ins', function (Blueprint $table) {
            if (Schema::hasColumn('check_ins', 'data')) {
                $table->dropColumn('data');
            }
        });
    }
};
