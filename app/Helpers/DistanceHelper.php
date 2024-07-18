<?php

namespace App\Helpers;

class DistanceHelper
{
    /**
     * Calculate the distance between two coordinates.
     *
     * @param float|null $latitudeFrom
     * @param float|null $longitudeFrom
     * @param float|null $latitudeTo
     * @param float|null $longitudeTo
     * @param int $earthRadius
     * @return float|null Distance in kilometers or null if any coordinate is null
     */
    public static function haversineGreatCircleDistance(
        ?float $latitudeFrom, ?float $longitudeFrom,
        ?float $latitudeTo, ?float $longitudeTo,
        int $earthRadius = 6371
    ): ?float {
        // Return null if any coordinate is null
        if (is_null($latitudeFrom) || is_null($longitudeFrom) || is_null($latitudeTo) || is_null($longitudeTo)) {
            return null;
        }

        // Convert from degrees to radians
        $latFrom = deg2rad($latitudeFrom);
        $lonFrom = deg2rad($longitudeFrom);
        $latTo = deg2rad($latitudeTo);
        $lonTo = deg2rad($longitudeTo);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));

        // Calculate the distance and round it to the nearest whole unit
        $distance = $angle * $earthRadius;
        return round($distance);
    }
}
