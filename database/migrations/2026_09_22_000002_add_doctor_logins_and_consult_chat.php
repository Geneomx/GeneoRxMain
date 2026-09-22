<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Doctors get a sign-in of their own, consults become a conversation, and an
 * appointment says how it happens — chat, call or visit.
 *
 * Column-guarded like the other doctor migrations: production has been through
 * one half-applied deploy on these tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            if (! Schema::hasColumn('doctors', 'user_id')) {
                // The account this clinician signs in with. Nullable: a doctor
                // can be listed in the directory long before they have a login,
                // and deleting the account must not delete the directory entry.
                $table->foreignId('user_id')->nullable()->unique()->after('id')
                    ->constrained()->nullOnDelete();
            }
        });

        Schema::table('appointment_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('appointment_requests', 'mode')) {
                // chat | call | visit. Existing rows were all arranged as
                // in-person, so that is the backfill as well as the default.
                $table->string('mode', 10)->default('visit')->after('slot_minutes');
            }
        });

        if (! Schema::hasTable('consult_messages')) {
            Schema::create('consult_messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('doctor_message_id')->constrained()->cascadeOnDelete();
                // Which side wrote it. Not derived from user_id, because an
                // admin may answer on the doctor's behalf and the patient must
                // still see that as coming from the doctor.
                $table->string('sender', 10);              // patient | doctor
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->text('body');
                // Null until the other side has seen it.
                $table->timestamp('read_at')->nullable();
                $table->timestamps();

                $table->index(['doctor_message_id', 'id'], 'consult_messages_thread_index');
            });
        }

        // Existing single replies become the first doctor turn in the thread,
        // so an old conversation reads the same way as a new one. The patient's
        // opening question stays on doctor_messages.body.
        if (Schema::hasTable('consult_messages') && DB::table('consult_messages')->count() === 0) {
            $replied = DB::table('doctor_messages')
                ->whereNotNull('reply_body')
                ->select('id', 'reply_body', 'replied_at', 'replied_by', 'created_at')
                ->get();

            foreach ($replied as $m) {
                DB::table('consult_messages')->insert([
                    'doctor_message_id' => $m->id,
                    'sender' => 'doctor',
                    'user_id' => $m->replied_by,
                    'body' => $m->reply_body,
                    // Already delivered: these were visible before this release.
                    'read_at' => $m->replied_at ?? $m->created_at,
                    'created_at' => $m->replied_at ?? $m->created_at,
                    'updated_at' => $m->replied_at ?? $m->created_at,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('consult_messages');
        Schema::table('appointment_requests', function (Blueprint $table) {
            $table->dropColumn('mode');
        });
        Schema::table('doctors', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
