<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MixMergeRate extends Model
{
    use HasFactory;

    protected $fillable = ["user_id", "setting_id", "rate_name", "service_code", "description", "condition", "price_calculation_type", "tags_to_combine", "tags_to_exclude", "min_shipping_rate", "mix_shipping_rate", "status"];

    protected $hidden = ['created_at', 'updated_at'];

    // public function getTagsToCombineAttribute($value)
    // {
    //     if (is_null($value)) {
    //         return null;
    //     }

    //     return explode(',', $value);
    // }
}
