<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Versioned parser templates (the regex/package/sender rules the app uses to
 * read wallet notifications & SMS). The app pulls the active template on launch
 * and applies it, so a wallet changing its wording never needs an app release.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parser_templates', function (Blueprint $table) {
            $table->id();
            $table->string('platform')->default('android');
            $table->unsignedInteger('version');
            $table->json('payload');            // the array of source templates
            $table->boolean('active')->default(false);
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->unique(['platform', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parser_templates');
    }
};
