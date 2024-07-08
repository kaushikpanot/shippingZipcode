<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Throwable;

class Rate extends Model
{
    use HasFactory;

    protected $fillable = ["user_id", "zone_id", "name", "base_price", "service_code", "description", "status", "conditionMatch", "cart_condition", "merge_rate_tag", "schedule_rate", "schedule_start_date_time", "schedule_end_date_time"];

    protected $hidden = ['created_at', 'updated_at'];

    protected $dates = [
        'schedule_start_date_time',
        'schedule_end_date_time'
    ];

    // List of possible date formats
    protected $dateFormats = [
        'd-m-Y h:i A',
        'd/m/Y h:i A',
        'Y-m-d H:i:s',
        'Y/m/d H:i:s',
        'Y-m-d h:i A',
        'Y/m/d h:i A',
        'Y-m-d',
        'Y/m/d',
        'd-m-Y',
        'd/m/Y',
    ];

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

    // Generic date-time mutator
    protected function setDateTimeAttribute($value, $attribute)
    {
        foreach ($this->dateFormats as $format) {
            try {
                $this->attributes[$attribute] = Carbon::createFromFormat($format, $value)->format('Y-m-d H:i:s');
                return;
            } catch (Throwable $e) {
                // Continue to the next format
            }
        }

        // If none of the formats match, throw an exception
        throw new \InvalidArgumentException("Invalid date format: $value");
    }

    // Mutator for schedule_start_date_time
    public function setScheduleStartDateTimeAttribute($value)
    {
        $this->setDateTimeAttribute($value, 'schedule_start_date_time');
    }

    // Mutator for schedule_end_date_time
    public function setScheduleEndDateTimeAttribute($value)
    {
        $this->setDateTimeAttribute($value, 'schedule_end_date_time');
    }

    // Accessor to convert date from 'Y-m-d H:i:s' format to 'd-m-Y H:i' format
    protected function getDateTimeAttribute($value, $attribute)
    {
        return Carbon::createFromFormat('Y-m-d H:i:s', $value)->format('d-m-Y h:i A');
    }

    public function getScheduleStartDateTimeAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }

        return $this->getDateTimeAttribute($value, 'schedule_start_date_time');
    }

    public function getScheduleEndDateTimeAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }

        return $this->getDateTimeAttribute($value, 'schedule_end_date_time');
    }   
}
