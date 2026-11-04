<?php

use App\Support\MedicationEvidence;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('medications')->whereNull('user_id')->whereNotNull('claims')->orderBy('id')->chunkById(100, function ($rows) {
            foreach ($rows as $row) {
                $claims = json_decode($row->claims, true);
                if (! is_array($claims)) {
                    continue;
                }
                $corrected = MedicationEvidence::correct($claims);
                if ($corrected !== $claims) {
                    DB::table('medications')->where('id', $row->id)->update(['claims' => json_encode($corrected)]);
                }
            }
        });
    }

    public function down(): void
    {
        // A rollback must not reintroduce an unrelated medical citation.
    }
};
