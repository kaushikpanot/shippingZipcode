<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->boolean('isCart')->default(false)->comment('0=disable, 1=enable');
            $table->boolean('isCheckout') ->default(false)->comment('0=disable, 1=enable');
            $table->boolean('isDeliveryEstimated')->default(false)->comment('0=disable, 1=enable');
            $table->boolean('isWaiting')->default(false)->comment('0=disable, 1=enable');
            $table->boolean('isShippingRate')->default(false)->comment('0=disable, 1=enable');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('settings');
    }
};
