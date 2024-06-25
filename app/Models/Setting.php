<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = ["user_id", "isCart", "isCheckout", "isDeliveryEstimated", "isWaiting", "isShippingRate"];

    protected $hidden = ['created_at', 'updated_at'];

    protected $casts = [
        'isCart' => 'boolean',
        'isCheckout' => 'boolean',
        'isDeliveryEstimated' => 'boolean',
        'isWaiting' => 'boolean',
        'isShippingRate' => 'boolean'
    ];
}
