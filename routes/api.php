<?php

use App\Http\Controllers\ApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });

Route::post('getResponse', [ApiController::class, 'getResponse']);

Route::middleware(['verify.shopify.jwt'])->group(function () {
    Route::controller(ApiController::class)->group(function () {
        Route::get('country', 'getCountryList');
        Route::get('currency', 'getCurrencyList');

        Route::post('zone/save', 'zoneStore');
        Route::get('zone/{id}/edit', 'zoneEdit');
        Route::get('zones/{name?}', 'zoneList');
        Route::delete('zone/{id}', 'zoneDestroy');

        Route::post('rate/save', 'rateStore');
        // Route::get('rate/{name?}', 'zoneList');
        // Route::get('zone/{id}/edit', 'zoneEdit');
        // Route::delete('zone/{id}', 'zoneDestroy');
    });
});
