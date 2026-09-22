<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A patient letting one named doctor see their health summary.
 *
 * Per doctor, never blanket: sharing with the GP you asked a question does not
 * hand your medications to every clinician in the directory. Revoking keeps
 * the row so the audit of who once had access survives, rather than deleting
 * the evidence.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('doctor_shares')) {
            return;
        }

        Schema::create('doctor_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            // One row per pair; granting again re-opens the same row.
            $table->unique(['user_id', 'doctor_id']);
            $table->index(['doctor_id', 'revoked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_shares');
    }
};
