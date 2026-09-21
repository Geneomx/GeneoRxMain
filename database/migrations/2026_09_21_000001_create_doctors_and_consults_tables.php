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
 *
 * ── Why this migration is defensive ──────────────────────────────────────────
 * The first run of this file failed on production MySQL:
 *
 *   1071 Specified key was too long; max key length is 1000 bytes
 *   alter table `doctors` add index `doctors_is_active_name_index`
 *
 * `name` was varchar(255), which under utf8mb4 is 255 x 4 = 1020 bytes — over
 * this server's limit before `is_active` is even added. Tests run on SQLite,
 * which has no key-length limit, so nothing local could have caught it.
 *
 * MySQL does not roll back DDL, so that run left `doctors` created and the other
 * two tables missing, with the migration unrecorded. Every step below is
 * therefore guarded and safe to re-run against that half-finished state.
 *
 * The index itself is gone rather than shortened. A directory of clinicians is
 * a few dozen rows; an index on (is_active, name) buys nothing and was the only
 * reason the deploy failed.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('doctors')) {
            Schema::create('doctors', function (Blueprint $table) {
                $table->id();
                // 160 matches the validation rule in AdminDoctorController, and
                // keeps the column well clear of MySQL's key-length limit.
                $table->string('name', 160);
                $table->string('specialty', 120)->nullable();
                // The clinician's own contact number, for the admin to reach
                // them. Never exposed to patients through the mobile API.
                $table->string('mobile', 40)->nullable();
                $table->string('email')->nullable();
                $table->text('bio')->nullable();
                $table->boolean('is_active')->default(true);
                // Which admin added this doctor. Kept for accountability: a
                // directory of clinicians is a claim the business is making.
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        } else {
            // Left behind by the failed run: the table exists with the original
            // varchar(255) name and no index. Narrow it so a fresh install and
            // this one end up with the same schema.
            Schema::table('doctors', function (Blueprint $table) {
                $table->string('name', 160)->change();
            });
        }

        if (! Schema::hasTable('doctor_messages')) {
            Schema::create('doctor_messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                // A doctor who leaves keeps their answers attached to the thread,
                // so the patient's history does not develop holes.
                $table->foreignId('doctor_id')->nullable()->constrained()->nullOnDelete();
                $table->text('body');
                // The patient's own number, given per message rather than taken
                // from the profile: consent to be phoned about THIS question.
                $table->string('contact_mobile', 40)->nullable();
                $table->string('status', 20)->default('new');   // new | answered | closed
                $table->text('reply_body')->nullable();
                $table->timestamp('replied_at')->nullable();
                $table->foreignId('replied_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                // Safe: status is 20 chars (80 bytes) and the rest are integers
                // and timestamps, nowhere near the limit.
                $table->index(['status', 'created_at']);
                $table->index(['user_id', 'created_at']);
            });
        }

        if (! Schema::hasTable('appointment_requests')) {
            Schema::create('appointment_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('doctor_id')->nullable()->constrained()->nullOnDelete();
                // A request, not a booking. The date is what the patient would
                // prefer; nothing here can commit a clinician's calendar.
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
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_requests');
        Schema::dropIfExists('doctor_messages');
        Schema::dropIfExists('doctors');
    }
};
