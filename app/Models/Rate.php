<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rate extends Model
{
    use HasFactory;

    protected $fillable = ["user_id", "zone_id", "name", "base_price", "service_code", "description", "status"];

    protected $hidden = ['created_at', 'updated_at'];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function zipcode()
    {
        return $this->hasOne(RateZipcode::class);
    }
}
