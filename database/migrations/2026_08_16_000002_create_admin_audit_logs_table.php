<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_audit_logs', function (Blueprint $table) {
            $table->id();
            // Keep the row even if the admin account is later deleted.
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('admin_email')->nullable(); // denormalized so history survives deletion
            $table->string('action', 60);              // e.g. user.delete, user.set-password
            $table->string('target_type', 40)->nullable(); // user | medication | feedback
            $table->unsignedBigInteger('target_id')->nullable();
            $table->string('target_label')->nullable();    // denormalized name/email of the target
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['action', 'created_at']);
            $table->index(['target_type', 'target_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_audit_logs');
    }
};
