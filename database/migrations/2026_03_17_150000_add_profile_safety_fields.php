<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add fields to user_profiles
        if (! Schema::hasColumn('user_profiles', 'gender')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->string('gender')->nullable()->after('date_of_birth');
            });
        }

        if (! Schema::hasColumn('user_profiles', 'pregnant')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->boolean('pregnant')->default(false)->after('gender');
            });
        }

        if (! Schema::hasColumn('user_profiles', 'kidney_disease')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->boolean('kidney_disease')->default(false)->after('pregnant');
            });
        }

        if (! Schema::hasColumn('user_profiles', 'anticoagulants')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->boolean('anticoagulants')->default(false)->after('kidney_disease');
            });
        }

        // Add fields to check_ins
        if (! Schema::hasColumn('check_ins', 'date_checked')) {
            Schema::table('check_ins', function (Blueprint $table) {
                $table->timestamp('date_checked')->nullable()->after('status');
            });
        }

        if (! Schema::hasColumn('check_ins', 'adherence_percentage')) {
            Schema::table('check_ins', function (Blueprint $table) {
                $table->integer('adherence_percentage')->default(0)->after('date_checked');
            });
        }

        // Add fields to medications table
        if (! Schema::hasColumn('medications', 'user_id')) {
            Schema::table('medications', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade')->after('id');
            });
        }

        if (! Schema::hasColumn('medications', 'medication_name')) {
            Schema::table('medications', function (Blueprint $table) {
                $table->string('medication_name')->nullable()->after('user_id');
            });
        }

        if (! Schema::hasColumn('medications', 'dosage')) {
            Schema::table('medications', function (Blueprint $table) {
                $table->string('dosage')->nullable()->after('medication_name');
            });
        }

        if (! Schema::hasColumn('medications', 'duration_months')) {
            Schema::table('medications', function (Blueprint $table) {
                $table->integer('duration_months')->default(0)->after('dosage');
            });
        }

        // Add fields to symptoms table
        if (! Schema::hasColumn('symptoms', 'user_id')) {
            Schema::table('symptoms', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade')->after('id');
            });
        }

        if (! Schema::hasColumn('symptoms', 'symptom_name')) {
            Schema::table('symptoms', function (Blueprint $table) {
                $table->string('symptom_name')->nullable()->after('user_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('user_profiles', 'gender')) {
                $table->dropColumn('gender');
            }
            if (Schema::hasColumn('user_profiles', 'pregnant')) {
                $table->dropColumn('pregnant');
            }
            if (Schema::hasColumn('user_profiles', 'kidney_disease')) {
                $table->dropColumn('kidney_disease');
            }
            if (Schema::hasColumn('user_profiles', 'anticoagulants')) {
                $table->dropColumn('anticoagulants');
            }
        });

        Schema::table('check_ins', function (Blueprint $table) {
            if (Schema::hasColumn('check_ins', 'date_checked')) {
                $table->dropColumn('date_checked');
            }
            if (Schema::hasColumn('check_ins', 'adherence_percentage')) {
                $table->dropColumn('adherence_percentage');
            }
        });

        Schema::table('medications', function (Blueprint $table) {
            if (Schema::hasColumn('medications', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
            if (Schema::hasColumn('medications', 'medication_name')) {
                $table->dropColumn('medication_name');
            }
            if (Schema::hasColumn('medications', 'dosage')) {
                $table->dropColumn('dosage');
            }
            if (Schema::hasColumn('medications', 'duration_months')) {
                $table->dropColumn('duration_months');
            }
        });

        Schema::table('symptoms', function (Blueprint $table) {
            if (Schema::hasColumn('symptoms', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
            if (Schema::hasColumn('symptoms', 'symptom_name')) {
                $table->dropColumn('symptom_name');
            }
        });
    }
};
