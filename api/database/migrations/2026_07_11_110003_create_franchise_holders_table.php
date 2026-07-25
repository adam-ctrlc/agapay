<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('franchise_holders', function (Blueprint $table) {
            $table->id();
            $table->string('license_number')->nullable()->index();
            $table->string('plate_number')->nullable()->index();
            $table->string('driver_name');
            $table->string('franchise_type')->default('puv');
            $table->string('barangay')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('franchise_holders');
    }
};
