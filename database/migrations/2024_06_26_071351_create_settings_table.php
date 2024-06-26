<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->boolean('status')->default(1)->comment("1=Enable, 0=Disable");
            $table->enum('shippingRate',['All', 'Only Higher', 'Only Lower'])->default('All');
            $table->enum('rateModifierTitle',['Append Description', 'Append Title', 'Replace Title', 'Replace Description', 'Replace Title and Description'])->default('Append Description');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
