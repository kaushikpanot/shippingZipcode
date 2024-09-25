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
        Schema::create('mix_merge_rates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('setting_id')->nullable();
            $table->foreign('setting_id')->references('id')->on('settings')->onDelete('cascade');
            $table->string('rate_name');
            $table->string('service_code')->nullable();
            $table->text('description')->nullable();
            $table->tinyInteger('condition')->comment('0=ALL rates must have at least one tag, 1=ANY rates found with tag')->default(0);
            $table->tinyInteger('price_calculation_type')->comment("0=SUM, 1=AVERAGE, 2=LOWEST, 3=HIGHEST, 4=MULTIPLY of the values");
            $table->text('tags_to_combine');
            $table->text('tags_to_exclude')->nullable()->comment('Tags To Exclude from Rate Calculation');
            $table->decimal('min_shipping_rate', 8, 2)->default(0.00);
            $table->decimal('mix_shipping_rate', 8, 2)->default(0.00);
            $table->boolean('status')->comment('1=enabled, 0=disabled')->default(1);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mix_merge_rates');
    }
};
