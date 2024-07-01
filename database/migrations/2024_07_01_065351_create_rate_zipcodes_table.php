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
        Schema::create('rate_zipcodes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('rate_id');
            $table->foreign('rate_id')->references('id')->on('rates')->onDelete('cascade');
            $table->enum('stateSelection', ['Custom', 'All'])->default('All');
            $table->text('state')->nullable();
            $table->enum('zipcodeSelection', ['Custom', 'All'])->default('All');
            $table->text('zipcode')->nullable();
            $table->enum('isInclude', ['Include', 'Exclude'])->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rate_zipcodes');
    }
};
