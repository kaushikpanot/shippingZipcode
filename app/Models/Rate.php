<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rate extends Model
{
    use HasFactory;

    protected $fillable = ["user_id", "zone_id", "name", "base_price", "service_code", "description", "status", "conditionMatch", "cart_condition", "merge_rate_tag"];

    protected $hidden = ['created_at', 'updated_at'];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function zipcode()
    {
        return $this->hasOne(RateZipcode::class);
    }

    public function setCartConditionAttribute($value)
    {
        $this->attributes['cart_condition'] = json_encode($value);
    }

    public function getCartConditionAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }

        return json_decode($value, true);
    }
}
