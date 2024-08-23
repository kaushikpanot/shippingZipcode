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
        Schema::table('rates', function (Blueprint $table) {
            $table->longText('rate_based_on_surcharge')->after('cart_condition')->nullable();
            $table->longText('rate_tier')->after('rate_based_on_surcharge')->nullable();
            $table->longText('exclude_rate_for_products')->after('rate_tier')->nullable();
            $table->longText('rate_modifiers')->after('exclude_rate_for_products')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rates', function (Blueprint $table) {
            $table->dropColumn('rate_based_on_surcharge');
            $table->dropColumn('rate_tier');
            $table->dropColumn('exclude_rate_for_products');
            $table->dropColumn('rate_modifiers');
        });
    }
};
