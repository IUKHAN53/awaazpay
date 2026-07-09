<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A shop = one owner account. Staff devices join it via join_code / an invite.
 * Payments and devices belong to a shop; that's the fan-out boundary.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('owner_phone')->nullable();
            $table->string('join_code', 12)->unique(); // for QR / quick staff join
            // Optional mapping used to resolve webhooks to a shop (merchant id).
            $table->string('merchant_ref')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shops');
    }
};
