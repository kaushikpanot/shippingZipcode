<?php

namespace App\Helpers;

class DistanceHelper
{
    // /**
    //  * Calculate the distance between two coordinates.
    //  *
    //  * @param float|null $latitudeFrom
    //  * @param float|null $longitudeFrom
    //  * @param float|null $latitudeTo
    //  * @param float|null $longitudeTo
    //  * @param int $earthRadius
    //  * @return float|null Distance in kilometers or null if any coordinate is null
    //  */
    // public static function haversineGreatCircleDistance(
    //     ?float $latitudeFrom,
    //     ?float $longitudeFrom,
    //     ?float $latitudeTo,
    //     ?float $longitudeTo,
    //     int $earthRadius = 6371
    //     ): ?float {
    //     // Return null if any coordinate is null
    //     if (is_null($latitudeFrom) || is_null($longitudeFrom) || is_null($latitudeTo) || is_null($longitudeTo)) {
    //         return null;
    //     }

    //     // Convert from degrees to radians
    //     $latFrom = deg2rad($latitudeFrom);
    //     $lonFrom = deg2rad($longitudeFrom);
    //     $latTo = deg2rad($latitudeTo);
    //     $lonTo = deg2rad($longitudeTo);

    //     $latDelta = $latTo - $latFrom;
    //     $lonDelta = $lonTo - $lonFrom;

    //     $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
    //         cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));

    //     // Calculate the distance and round it to the nearest whole unit
    //     $distance = $angle * $earthRadius;
    //     return round($distance);
    // }

    /**
     * Calculate the great-circle distance between two coordinates using the Haversine formula.
     *
     * @param float|null $latitudeFrom Latitude of the starting point.
     * @param float|null $longitudeFrom Longitude of the starting point.
     * @param float|null $latitudeTo Latitude of the destination point.
     * @param float|null $longitudeTo Longitude of the destination point.
     * @param int $earthRadius Earth radius in kilometers (default is 6371 km).
     * @return float|null Distance in kilometers, or null if any coordinate is null.
     */
    public static function haversineGreatCircleDistance(
        ?float $latitudeFrom,
        ?float $longitudeFrom,
        ?float $latitudeTo,
        ?float $longitudeTo,
        int $earthRadius = 6371
    ): ?float {
        // Check if any of the coordinates are null
        if (!self::areCoordinatesValid($latitudeFrom, $longitudeFrom, $latitudeTo, $longitudeTo)) {
            return null;
        }

        // Convert coordinates from degrees to radians
        $latFrom = deg2rad($latitudeFrom);
        $lonFrom = deg2rad($longitudeFrom);
        $latTo = deg2rad($latitudeTo);
        $lonTo = deg2rad($longitudeTo);

        // Calculate deltas
        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        // Haversine formula
        $angle = self::calculateAngle($latFrom, $latTo, $latDelta, $lonDelta);

        // Calculate and round the distance
        return round($angle * $earthRadius);
    }

    /**
     * Check if the coordinates are valid (non-null).
     *
     * @param float|null ...$coordinates Coordinates to validate.
     * @return bool True if all coordinates are non-null, false otherwise.
     */
    private static function areCoordinatesValid(?float ...$coordinates): bool
    {
        return !in_array(null, $coordinates, true);
    }

    /**
     * Calculate the angle between two points using the Haversine formula.
     *
     * @param float $latFrom Radians of the starting latitude.
     * @param float $latTo Radians of the destination latitude.
     * @param float $latDelta Difference between latitudes in radians.
     * @param float $lonDelta Difference between longitudes in radians.
     * @return float The central angle in radians.
     */
    private static function calculateAngle(float $latFrom, float $latTo, float $latDelta, float $lonDelta): float
    {
        return 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
    }
}
