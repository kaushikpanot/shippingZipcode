<?php

use App\Http\Controllers\ApiController;
use App\Http\Controllers\MixMergeRateController;
use App\Http\Controllers\SettingContoller;
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

Route::post('carrier/callback', [ApiController::class, 'handleCallback']);
Route::get('conditionConvertSymbol/{name}', [ApiController::class, 'conditionConvertSymbol']);

// Route::middleware(['verify.shopify.jwt'])->group(function () {
    Route::resource('settings', SettingContoller::class);
    Route::resource('mixMergeRate', MixMergeRateController::class);

    Route::controller(ApiController::class)->group(function () {
        Route::get('country', 'getCountryList');
        Route::post('state', 'getStateList');
        Route::get('currency', 'getCurrencyList');

        Route::post('zone/save', 'zoneStore');
        Route::post('zone/detail', 'zoneEdit');
        Route::get('zones/{name?}', 'zoneList');
        Route::delete('zone/{id}', 'zoneDestroy');

        Route::post('rate/save', 'rateStore');
        Route::get('rates/{zone_id}/{name?}', 'rateList');
        Route::get('rate/{id}/edit', 'rateEdit');
        Route::get('rate/{zoneId}/create', 'rateCreate');
        Route::delete('rate/{id}', 'rateDestroy');

        Route::get('shop/location', 'getShopLocation');
        Route::post('products', 'getProductList');
    });
// });
