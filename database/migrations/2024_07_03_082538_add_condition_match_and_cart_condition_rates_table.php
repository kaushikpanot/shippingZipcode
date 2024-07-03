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
            $table->enum('conditionMatch', ["Not Any Condition", "All", "Any", "NOT All"])->after('status')->default('Not Any Condition');
            $table->longText('cart_condition')->after('conditionMatch')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rates', function (Blueprint $table) {
            $table->dropColumn('conditionMatch');
            $table->dropColumn('cartCondition');
        });
    }
};
