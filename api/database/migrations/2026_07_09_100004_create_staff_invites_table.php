<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One-time codes an owner generates so a staff member's phone can join the shop
 * and start receiving payment announcements. Codes expire and are single-use.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_invites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->string('code', 12)->unique();
            $table->string('phone')->nullable();
            $table->enum('status', ['pending', 'accepted', 'expired'])->default('pending');
            $table->foreignId('accepted_device_id')->nullable()->constrained('devices')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_invites');
    }
};
