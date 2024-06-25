<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ZoneCountry extends Model
{
    use HasFactory;

    protected $fillable  = ["user_id", "zone_id", "countryCode", "country"];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }
}
