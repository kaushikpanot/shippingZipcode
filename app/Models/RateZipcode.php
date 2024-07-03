<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RateZipcode extends Model
{
    use HasFactory;

    protected $fillable = ["user_id", "rate_id", "stateSelection", "state", "zipcodeSelection", "zipcode", "isInclude"];

    protected $hidden = ['created_at', 'updated_at'];

    public function getStateAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }

        return json_decode($value);
    }

    public function getZipcodeAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }

        return explode(',', $value);
    }
}
