<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('check_ins', function (Blueprint $table) {
            $table->integer('adherence_percentage')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        DB::table('check_ins')->whereNull('adherence_percentage')->update(['adherence_percentage' => 0]);
        Schema::table('check_ins', function (Blueprint $table) {
            $table->integer('adherence_percentage')->nullable(false)->default(0)->change();
        });
    }
};
