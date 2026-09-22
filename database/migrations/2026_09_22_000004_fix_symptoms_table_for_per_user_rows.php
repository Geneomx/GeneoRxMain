<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Let a patient save their symptoms.
 *
 * The table was created as a global catalog — `name` and `slug`, both NOT NULL
 * and UNIQUE — and later grew `user_id` and `symptom_name` for per-user rows.
 * Nothing ever used the catalog side, but the constraints stayed, so
 * HomeController::saveProfile, which writes only user_id + symptom_name, hit
 * "NOT NULL constraint failed: symptoms.name" on every save that carried a
 * symptom. Both the website and the app send that field, so selecting a
 * symptom and saving failed outright.
 *
 * Making the two vestigial columns optional is the whole fix; the unique
 * indexes go with them, since per-user rows legitimately repeat a name.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('symptoms')) {
            return;
        }

        // Drop first: a unique index across every user's rows would reject the
        // second person to record "Fatigue" even once the columns are nullable.
        foreach (['symptoms_name_unique', 'symptoms_slug_unique'] as $index) {
            try {
                Schema::table('symptoms', fn (Blueprint $table) => $table->dropUnique($index));
            } catch (Throwable) {
                // Already gone, or never created on this connection.
            }
        }

        Schema::table('symptoms', function (Blueprint $table) {
            if (Schema::hasColumn('symptoms', 'name')) {
                $table->string('name')->nullable()->change();
            }
            if (Schema::hasColumn('symptoms', 'slug')) {
                $table->string('slug')->nullable()->change();
            }
        });

        if (! Schema::hasIndex('symptoms', 'symptoms_user_id_index')) {
            Schema::table('symptoms', fn (Blueprint $table) => $table->index('user_id'));
        }
    }

    public function down(): void
    {
        // Deliberately not reversed: restoring NOT NULL would fail against the
        // rows this migration exists to allow, and restoring the unique
        // indexes would fail against two patients sharing a symptom.
    }
};
