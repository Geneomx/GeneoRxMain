<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Admin role tier — only meaningful when is_admin = true.
            //   owner   → full control incl. deleting users and managing admins
            //   admin   → day-to-day management, no destructive account actions
            //   support → read-mostly: view users/feedback, no writes to accounts
            $table->string('role', 20)->nullable()->after('is_admin');
        });

        // Existing admins keep full power until an owner is explicitly chosen:
        // promote every current admin to owner so nothing breaks on deploy.
        DB::table('users')->where('is_admin', true)->update(['role' => 'owner']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
