<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Throwable;

class Rate extends Model
{
    use HasFactory;

    protected $fillable = ["user_id", "zone_id", "name", "base_price", "service_code", "description", "status", "conditionMatch", "cart_condition", "rate_based_on_surcharge", "rate_tier", "exclude_rate_for_products", "rate_modifiers", "merge_rate_tag", "schedule_rate", "schedule_start_date_time", "schedule_end_date_time", "send_another_rate"];

    protected $hidden = ['created_at', 'updated_at'];

    protected $dates = [
        'schedule_start_date_time',
        'schedule_end_date_time'
    ];

    // List of possible date formats
    // protected $dateFormats = [
    //     'd-m-Y h:i A',
    //     'd/m/Y h:i A',
    //     'Y-m-d H:i:s',
    //     'Y/m/d H:i:s',
    //     'Y-m-d h:i A',
    //     'Y/m/d h:i A',
    //     'Y-m-d',
    //     'Y/m/d',
    //     'd-m-Y',
    //     'd/m/Y',
    // ];

    protected $dateFormats = [
        'Y-m-d\TH:i',
        'Y-m-d\TH:i A',
        'Y-m-d H:i:s',
        'Y/m/d H:i:s',
        'Y-m-d h:i A',
        'Y/m/d h:i A',
        'Y-m-d',
        'Y/m/d'
    ];

    // protected $dateFormats = [
    //     'd/m/Y',
    //     'Y-m-d',
    //     'Y/m/d',
    //     'd-m-Y'
    // ];

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

    /**
     * Set the schedule start date and time attribute.
     *
     * @param string|null $value The date and time value to set.
     */
    public function setScheduleStartDateTimeAttribute(?string $value): void
    {
        if ($value === null) {
            return;
        }

        $this->setDateTimeAttribute($value, 'schedule_start_date_time');
    }

    // Mutator for schedule_end_date_time
    public function setScheduleEndDateTimeAttribute($value)
    {
        if ($value === null) {
            return;
        }

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

    // Mutator for rate_based_on_surcharge
    public function setRateBasedOnSurchargeAttribute($value)
    {
        if (!empty($value)) {
            // Check if $value is an array or an object and JSON encode it
            if (is_array($value) || is_object($value)) {
                $this->attributes['rate_based_on_surcharge'] = json_encode($value);
            } else {
                // If $value is already a JSON string, assign it directly
                $this->attributes['rate_based_on_surcharge'] = $value;
            }
        } else {
            // If $value is null or empty, set the attribute to null or handle accordingly
            $this->attributes['rate_based_on_surcharge'] = null;
        }
    }

    public function getRateBasedOnSurchargeAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }

        return json_decode($value, true); // true to return as an associative array
    }

    public function setRateTierAttribute($value)
    {
        if (!empty($value)) {
            // Check if $value is an array or an object and JSON encode it
            if (is_array($value) || is_object($value)) {
                $this->attributes['rate_tier'] = json_encode($value);
            } else {
                // If $value is already a JSON string, assign it directly
                $this->attributes['rate_tier'] = $value;
            }
        } else {
            // If $value is null or empty, set the attribute to null or handle accordingly
            $this->attributes['rate_tier'] = null;
        }
    }

    public function getRateTierAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }

        return json_decode($value, true); // true to return as an associative array
    }

    public function setExcludeRateForProductsAttribute($value)
    {
        if (!empty($value)) {
            if (is_array($value) || is_object($value)) {
                $this->attributes['exclude_rate_for_products'] = json_encode($value);
            } else {
                $this->attributes['exclude_rate_for_products'] = $value;
            }
        } else {
            $this->attributes['exclude_rate_for_products'] = null;
        }
    }

    public function getExcludeRateForProductsAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }

        return json_decode($value, true); // true to return as an associative array
    }

    public function setRateModifiersAttribute($value)
    {
        if (!empty($value)) {
            if (is_array($value) || is_object($value)) {
                $this->attributes['rate_modifiers'] = json_encode($value);
            } else {
                $this->attributes['rate_modifiers'] = $value;
            }
        } else {
            $this->attributes['rate_modifiers'] = null;
        }
    }

    public function getRateModifiersAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }

        return json_decode($value, true); // true to return as an associative array
    }

    public function setSendAnotherRateAttribute($value)
    {
        if (!empty($value)) {
            if (is_array($value) || is_object($value)) {
                $this->attributes['send_another_rate'] = json_encode($value);
            } else {
                $this->attributes['send_another_rate'] = $value;
            }
        } else {
            $this->attributes['send_another_rate'] = null;
        }
    }

    public function getSendAnotherRateAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }

        return json_decode($value, true); // true to return as an associative array
    }
}
