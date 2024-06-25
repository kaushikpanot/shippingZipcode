<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Zone extends Model
{
    use HasFactory;

    protected $fillable = ["user_id", "name", "country", "currency", "countryCode"];

    protected $hidden = [
        'created_at', 'updated_at',
    ];

    public function rates()
    {
        return $this->hasMany(Rate::class, 'zone_id', 'id');
    }

    public function countries()
    {
        return $this->hasMany(ZoneCountry::class);
    }

    public function scopeForUserInCountry($query, $userId, $countryCode)
    {
        return $query->where('user_id', $userId)
            ->whereHas('countries', function ($query) use ($countryCode) {
                $query->where('countryCode', $countryCode);
            });
    }
}
