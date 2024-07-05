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
            $table->boolean('schedule_rate')->default(0)->after('merge_rate_tag')->comment("1=Yes 0=No");
            $table->dateTime('schedule_start_date_time')->nullable()->after('schedule_rate');
            $table->dateTime('schedule_end_date_time')->nullable()->after('schedule_start_date_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rates', function (Blueprint $table) {
            //
        });
    }
};
