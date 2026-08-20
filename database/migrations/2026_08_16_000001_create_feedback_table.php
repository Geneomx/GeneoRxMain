<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
