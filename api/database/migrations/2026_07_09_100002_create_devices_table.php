<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A phone running AwaazPay. The owner's device creates the shop; staff devices
 * join it. api_token (hashed) authenticates API calls; fcm_token receives push
 * so the device announces payments detected elsewhere (staff / webhooks).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->enum('role', ['owner', 'staff'])->default('staff');
            $table->string('platform')->default('android');
            $table->string('fcm_token')->nullable();
            $table->string('api_token', 64)->unique(); // sha256 hash of the bearer token
            $table->boolean('active')->default(true);
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
