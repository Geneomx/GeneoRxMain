<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Real appointment slots. A doctor gets working days, hours and a length per
 * patient; a booking holds one slot on that grid.
 *
 * Column-guarded like the doctors migration, because production has already
 * been through one half-applied deploy on these tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            if (! Schema::hasColumn('doctors', 'available_days')) {
                // ISO weekdays, comma-separated ("1,2,3,4,5" is Mon–Fri). A
                // string rather than JSON: production MySQL is old enough that
                // a JSON column is not a safe bet.
                $table->string('available_days', 32)->nullable()->after('is_active');
            }
            if (! Schema::hasColumn('doctors', 'available_from')) {
                $table->string('available_from', 5)->nullable()->after('available_days');   // "09:00"
            }
            if (! Schema::hasColumn('doctors', 'available_to')) {
                $table->string('available_to', 5)->nullable()->after('available_from');     // "17:00"
            }
            if (! Schema::hasColumn('doctors', 'slot_minutes')) {
                $table->unsignedSmallInteger('slot_minutes')->default(30)->after('available_to');
            }
        });

        Schema::table('appointment_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('appointment_requests', 'slot_at')) {
                // Stored in UTC; shown as clinic wall-clock time.
                $table->dateTime('slot_at')->nullable()->after('preferred_time');
                $table->index(['doctor_id', 'slot_at'], 'appointment_requests_doctor_slot_index');
            }
            if (! Schema::hasColumn('appointment_requests', 'slot_minutes')) {
                $table->unsignedSmallInteger('slot_minutes')->nullable()->after('slot_at');
            }
        });

        // Doctors that predate this get the default week, so they are bookable
        // straight away; the admin page can change it.
        DB::table('doctors')->whereNull('available_from')->update([
            'available_days' => '1,2,3,4,5',
            'available_from' => '09:00',
            'available_to' => '17:00',
            'slot_minutes' => 30,
        ]);
    }

    public function down(): void
    {
        Schema::table('appointment_requests', function (Blueprint $table) {
            $table->dropIndex('appointment_requests_doctor_slot_index');
            $table->dropColumn(['slot_at', 'slot_minutes']);
        });
        Schema::table('doctors', function (Blueprint $table) {
            $table->dropColumn(['available_days', 'available_from', 'available_to', 'slot_minutes']);
        });
    }
};
