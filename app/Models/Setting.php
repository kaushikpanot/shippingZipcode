<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = ["user_id", "status", "shippingRate", "rateModifierTitle", "mix_merge_rate", "mix_merge_rate_1", "additional_description_of_mix_rate", "max_price_of_auto_product_base_mix_rate", "google_map_api_key"];

    protected $hidden = ['created_at', 'updated_at', 'mix_merge_rate_1', 'additional_description_of_mix_rate', 'max_price_of_auto_product_base_mix_rate', 'rateModifierTitle'];
}
