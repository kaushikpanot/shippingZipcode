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
        Schema::table('settings', function (Blueprint $table) {
            $table->boolean('mix_merge_rate')->after('rateModifierTitle')->nullable()->comment("0 = Yes (Automatic), 1 = No (Manually - Using merge rate)");
            $table->boolean('mix_merge_rate_1')->after('mix_merge_rate')->nullable()->comment("0 = Yes, 1 = No)");
            $table->string('additional_description_of_mix_rate')->after('mix_merge_rate_1')->nullable();
            $table->double('max_price_of_auto_product_base_mix_rate', 8, 2)->after('additional_description_of_mix_rate')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn('mix_merge_rate');
            $table->dropColumn('mix_merge_rate_1');
            $table->dropColumn('additional_description_of_mix_rate');
            $table->dropColumn('max_price_of_auto_product_base_mix_rate');
        });
    }
};
