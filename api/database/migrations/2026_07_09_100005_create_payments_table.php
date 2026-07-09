<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A received payment — synced up from a device that detected it, or created
 * from an official IPN webhook. Powers the cross-device dashboard/totals and,
 * on creation, fans out to the shop's other devices via FCM.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('source', ['easypaisa', 'jazzcash', 'bank']);
            $table->string('payer')->nullable();
            $table->unsignedBigInteger('amount'); // whole rupees
            $table->string('txn_id')->nullable();
            $table->enum('origin', ['device', 'webhook'])->default('device');
            $table->timestamp('received_at');
            $table->timestamps();

            $table->index(['shop_id', 'received_at']);
            // Cross-device dedupe: the same txn only lands once per shop.
            $table->unique(['shop_id', 'txn_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
