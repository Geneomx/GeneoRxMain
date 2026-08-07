<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            if (! Schema::hasColumn('medications', 'aliases')) {
                // Brand names and common spellings, so patients can search for
                // what is printed on the box ("Glucophage") not just the generic.
                $table->json('aliases')->nullable()->after('claims');
            }
        });
    }

    public function down(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            if (Schema::hasColumn('medications', 'aliases')) {
                $table->dropColumn('aliases');
            }
        });
    }
};
