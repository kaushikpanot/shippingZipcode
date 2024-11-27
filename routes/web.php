<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\RecurringChargeController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('recurring/create', [RecurringChargeController::class, 'createRecurringCharge']);
Route::get('recurring/confirm', [RecurringChargeController::class, 'confirmRecurringCharge']);

Route::get('/', [HomeController::class, 'index'])->middleware(['verify.shop', 'verify.shopify'])->name('home');
Route::get('/{path}', [HomeController::class, 'common'])->where('path', '[a-zA-Z0-9-_]+')->middleware(['verify.shop']);


Route::post('/webhook/checkouts-create', [WebhookController::class, 'handleCheckoutsCreate']);

Route::post('/webhook/carts-create', [WebhookController::class, 'handleCartsCreate']);
