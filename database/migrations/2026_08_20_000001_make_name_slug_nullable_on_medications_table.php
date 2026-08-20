<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `name`/`slug` were NOT NULL from the original catalog-only schema. A later
     * migration bolted on user_id/medication_name for per-user tracked-medication
     * rows, but never relaxed these two — so every Medication::create() for a
     * patient's tracked medication (which has no name/slug) has been throwing a
     * DB-level NOT NULL violation, silently failing the whole saveProfile() call.
     */
    public function up(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            $table->string('name')->nullable()->change();
            $table->string('slug')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            $table->string('name')->nullable(false)->change();
            $table->string('slug')->nullable(false)->change();
        });
    }
};
