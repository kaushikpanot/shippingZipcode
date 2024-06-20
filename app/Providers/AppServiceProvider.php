<?php

namespace App\Providers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
        Log::info("app ins");

    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
