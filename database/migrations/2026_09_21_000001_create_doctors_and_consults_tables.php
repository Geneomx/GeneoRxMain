<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Doctor directory, async questions, and appointment requests.
 *
 * Doctors are created by an admin — there is no self-registration and no doctor
 * login. An admin records the doctor's reply against the message, so the patient
 * sees an answer attributed to a named clinician without the project having to
 * build and secure a second authentication surface. If doctors later need to
 * answer directly, `doctor_messages.replied_by` already records who wrote it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('specialty')->nullable();
            // The clinician's own contact number, for the admin to reach them.
            // Never exposed to patients through the mobile API.
            $table->string('mobile', 40)->nullable();
            $table->string('email')->nullable();
            $table->text('bio')->nullable();
            $table->boolean('is_active')->default(true);
            // Which admin added this doctor. Kept for accountability: a directory
            // of clinicians is a claim the business is making.
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['is_active', 'name']);
        });

        Schema::create('doctor_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // A doctor who leaves keeps their answers attached to the thread, so
            // the patient's history does not develop holes.
            $table->foreignId('doctor_id')->nullable()->constrained()->nullOnDelete();
            $table->text('body');
            // The patient's own number, given per message rather than taken from
            // the profile: consent to be phoned about THIS question.
            $table->string('contact_mobile', 40)->nullable();
            $table->string('status', 20)->default('new');   // new | answered | closed
            $table->text('reply_body')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->foreignId('replied_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('appointment_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained()->nullOnDelete();
            // A request, not a booking. The date is what the patient would prefer;
            // nothing in this system can commit a clinician's calendar.
            $table->date('preferred_date')->nullable();
            $table->string('preferred_time', 40)->nullable();  // morning | afternoon | evening
            $table->text('note')->nullable();
            $table->string('contact_mobile', 40)->nullable();
            $table->string('status', 20)->default('requested'); // requested | confirmed | declined | done
            $table->text('admin_note')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_requests');
        Schema::dropIfExists('doctor_messages');
        Schema::dropIfExists('doctors');
    }
};
