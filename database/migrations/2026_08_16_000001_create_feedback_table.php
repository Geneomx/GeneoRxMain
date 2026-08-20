<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('feedback')) {
            Schema::create('feedback', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('type', 40)->default('other'); // bug | suggestion | question | other
                $table->text('message');
                $table->boolean('can_contact')->default(false);
                $table->string('source', 20)->default('web'); // web | mobile
                $table->string('status', 20)->default('new'); // new | reviewed | resolved
                $table->string('contact_email')->nullable();  // for guests who allow contact
                $table->timestamps();

                $table->index(['status', 'created_at']);
            });

            return;
        }

        // A pre-existing `feedback` table predates this migration (older, unrelated feature).
        // Reconcile its schema in place instead of dropping it, so existing rows survive.
        $userIdIsNullable = collect(Schema::getColumns('feedback'))
            ->firstWhere('name', 'user_id')['nullable'] ?? true;

        if (! $userIdIsNullable) {
            // The API route is guest-friendly (no login required), so user_id must accept null.
            Schema::table('feedback', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->change();
            });
        }

        Schema::table('feedback', function (Blueprint $table) {
            if (! Schema::hasColumn('feedback', 'source')) {
                $table->string('source', 20)->default('web')->after('can_contact');
            }
            if (! Schema::hasColumn('feedback', 'status')) {
                $table->string('status', 20)->default('new')->after('source');
            }
            if (! Schema::hasColumn('feedback', 'contact_email')) {
                $table->string('contact_email')->nullable();
            }
        });

        if (Schema::hasColumn('feedback', 'email')) {
            // Copy legacy `email` values over rather than renaming the column in place —
            // renameColumn() needs MySQL 8.0.8+/MariaDB 10.5.2+ native support, which
            // shared hosting doesn't reliably have. The old column is left unused.
            DB::table('feedback')->whereNotNull('email')->update([
                'contact_email' => DB::raw('email'),
            ]);
        }

        DB::table('feedback')->whereNull('status')->update(['status' => 'new']);

        Schema::table('feedback', function (Blueprint $table) {
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
