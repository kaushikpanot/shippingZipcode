<?php

namespace App\Http\Controllers;

use App\Helpers\DistanceHelper;
use App\Models\MixMergeRate;
use App\Models\Rate;
use App\Models\RateZipcode;
use App\Models\Setting;
use App\Models\User;
use App\Models\Zone;
use App\Models\ZoneCountry;
use Carbon\Carbon;
use Illuminate\Http\Request;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;
use CountryState;
use Currency\Util\CurrencySymbolUtil;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class ApiController extends Controller
{
    public function getCountryList(Request $request)
    {
        try {
            // Retrieve the Shopify session
            $shop = $request->attributes->get('shopifySession');

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            // Fetch the token for the shop
            $token = User::where('name', $shop)->pluck('password')->first();

            if (!$token) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $apiVersion = config('services.shopify.api_version');

            $query = <<<'GRAPHQL'
                query AllMarkets($after: String) {
                    markets(first: 250, after: $after) {
                        edges {
                            node {
                                ...MarketSummary
                            }
                        }
                    }
                    }

                    fragment MarketSummary on Market {
                    id
                    name
                    handle
                    active: enabled
                    primary
                    regions(first: 250) {
                        edges {
                        node {
                            id
                            name
                            ... on MarketRegionCountry {
                            code

                            }
                        }
                        }
                    }
                    __typename
                }
                GRAPHQL;

            $customHeaders = [
                'X-Shopify-Access-Token' => $token,
            ];

            $graphqlEndpoint = "https://{$shop}/admin/api/{$apiVersion}/graphql.json";

            $response = Http::withHeaders($customHeaders)->post($graphqlEndpoint, ['query' => $query]);

            $countriesArray = $response->json();

            $countries = [];

            // Iterate over the associative array and format it into an array of objects
            foreach ($countriesArray['data']['markets']['edges'] as $market) {
                if ($market['node']['active']) {
                    foreach ($market['node']['regions']['edges'] as $region) {
                        $country = $region['node'];
                        if (isset($country['code']) && isset($country['name'])) {
                            $countries[] = [
                                'code' => $country['code'],
                                'name' => $country['name'],
                                'nameCode' => $country['name'] . " " . "(" . $country['code'] . ")"
                            ];
                        }
                    }
                }
            }

            return response()->json(['status' => true, 'message' => 'countries list retrieved successfully.', 'countries' => $countries]);
        } catch (RequestException $e) {
            // Handle request-specific exceptions
            Log::error('HTTP request error', ['exception' => $e->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred:']);
        } catch (\Throwable $th) {
            Log::error('Unexpected error', ['exception' => $th->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred:']);
        }
    }

    public function getStateList(Request $request)
    {
        try {
            // Retrieve the Shopify session
            $shop = $request->attributes->get('shopifySession');
            // $shop = "krishnalaravel-test.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            // Fetch the token for the shop
            $token = User::where('name', $shop)->value('password');

            if (!$token) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            // Validate the request input
            $validated = $request->validate([
                'country' => 'required|array',
                'country.*.code' => 'required|string',
                'country.*.name' => 'required|string',
            ]);

            $states = [];

            foreach ($validated['country'] as $country) {
                $stateList = CountryState::getStates($country['code']);

                // Iterate over the associative array and format it into an array of objects
                foreach ($stateList as $isoCode => $name) {
                    $states[$country['name']][] = [
                        'code' => $isoCode,
                        'name' => $name,
                        'nameCode' => "$name ($isoCode)"
                    ];
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'States list retrieved successfully.',
                'states' => $states
            ]);
        } catch (\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid input data.',
                'errors' => $e->errors()
            ], 422);
        } catch (RequestException $e) {
            // Handle request-specific exceptions
            Log::error('HTTP request error', ['exception' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'An error occurred while processing the request.'
            ], 500);
        } catch (Throwable $th) {
            Log::error('Unexpected error', ['exception' => $th->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'An unexpected error occurred.'
            ], 500);
        }
    }

    public function getCurrencyList()
    {
        try {
            // Retrieve the Shopify session
            $shop = request()->attributes->get('shopifySession');
            // $shop = "krishnalaravel-test.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            // Fetch the token for the shop
            $token = User::where('name', $shop)->first();

            if (!$token) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $jsonFileData = file_get_contents(public_path('countries_states.json'));

            $countryData = collect(json_decode($jsonFileData, true));

            $filterCurrency = $countryData->map(function ($currency) {

                return [
                    'code' => $currency['currency'],
                    'symbol' => $currency['currency_symbol'],
                    'currency' => $currency['currency_name'],
                    'currency_code_symbol' => $currency['currency_name'] . " ({$currency['currency']} {$currency['currency_symbol']})"
                ];
            })->unique('currency_code_symbol')->values();

            return response()->json(['status' => true, 'message' => 'Currencies retrieved successfully.', 'shop_currency' => $token['shop_currency'], 'currencies' => $filterCurrency]);
        } catch (RequestException $e) {
            // Handle request-specific exceptions
            Log::error('HTTP request error', ['exception' => $e->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred:']);
        } catch (Throwable $th) {
            Log::error('Unexpected error', ['exception' => $th->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred:']);
        }
    }

    private function checkCondition($condition, $totalQuantity)
    {
        if (!isset($condition['condition'], $condition['value'])) {
            Log::warning('Invalid condition format', [
                'condition' => $condition,
                'totalQuantity' => $totalQuantity,
            ]);
            return false;
        }

        $conditionType = $condition['condition'];
        $value = $condition['value'];
        $value2 = $condition['value2'] ?? null;

        // Convert comma-separated string to array if needed and trim spaces
        $value = is_string($value) && strpos($value, ',') !== false ? array_map('trim', explode(',', $value)) : $value;
        $totalQuantity = is_string($totalQuantity) && strpos($totalQuantity, ',') !== false ? array_map('trim', explode(',', $totalQuantity)) : $totalQuantity;

        $result = false;

        switch ($conditionType) {
            case 'equal':
                if (is_array($value) && is_array($totalQuantity)) {
                    $result = !empty(array_intersect($totalQuantity, $value));
                } elseif (is_array($value)) {
                    $result = in_array($totalQuantity, $value);
                } elseif (is_array($totalQuantity)) {
                    $result = in_array($value, $totalQuantity);
                } else {
                    $result = $totalQuantity == $value;
                }
                break;
            case 'notequal':
                if (is_array($value) && is_array($totalQuantity)) {
                    $result = empty(array_intersect($totalQuantity, $value));
                } elseif (is_array($value)) {
                    $result = !in_array($totalQuantity, $value);
                } elseif (is_array($totalQuantity)) {
                    $result = !in_array($value, $totalQuantity);
                } else {
                    $result = $totalQuantity != $value;
                }
                break;
            case 'gthenoequal':
                $result = $totalQuantity >= $value;
                break;
            case 'lthenoequal':
                $result = $totalQuantity <= $value;
                break;
            case 'between':
                if ($value2 !== null) {
                    $result = $totalQuantity >= $value && $totalQuantity <= $value2;
                } else {
                    Log::warning('Missing value2 for "between" condition', [
                        'totalQuantity' => $totalQuantity,
                        'condition' => $conditionType,
                        'value' => $value,
                        'value2' => $value2,
                    ]);
                }
                break;
            case 'contains':
                $result = $this->checkContains($totalQuantity, $value);
                break;
            case 'notcontains':
                $result = !$this->checkContains($totalQuantity, $value);
                break;
            case 'startwith':
                $result = $this->checkStartsWith($totalQuantity, $value);
                break;
            case 'notstartwith':
                $result = !$this->checkStartsWith($totalQuantity, $value);
                break;
            case 'modular0':
                if ($value == 0) {
                    Log::warning('Division by zero for "modular0" condition', [
                        'totalQuantity' => $totalQuantity,
                        'condition' => $conditionType,
                        'value' => $value,
                    ]);
                } else {
                    $result = $this->checkModular($totalQuantity, $value, true);
                }
                break;
            case 'modularnot0':
                if ($value == 0) {
                    Log::warning('Division by zero for "modularnot0" condition', [
                        'totalQuantity' => $totalQuantity,
                        'condition' => $conditionType,
                        'value' => $value,
                    ]);
                } else {
                    $result = $this->checkModular($totalQuantity, $value, false);
                }
                break;
            default:
                Log::warning('Unknown condition type', [
                    'condition' => $conditionType,
                    'totalQuantity' => $totalQuantity,
                ]);
                break;
        }

        Log::info('Condition check result', [
            'totalQuantity' => $totalQuantity,
            'condition' => $conditionType,
            'condition_value' => $value,
            'condition_value2' => $value2,
            'result' => $result,
        ]);

        return $result;
    }

    private function checkContains($totalQuantity, $value)
    {
        // Case 1: value and totalQuantity are both not arrays
        if (!is_array($value) && !is_array($totalQuantity)) {
            return strpos((string)$totalQuantity, $value) !== false;
        }

        // Case 2: value is an array and totalQuantity is not
        if (is_array($value) && !is_array($totalQuantity)) {
            foreach ($value as $val) {
                if (strpos((string)$totalQuantity, $val) !== false) {
                    return true;
                }
            }
            return false;
        }

        // Case 3: value is not an array and totalQuantity is an array
        if (!is_array($value) && is_array($totalQuantity)) {
            foreach ($totalQuantity as $qty) {
                if (strpos((string)$qty, $value) !== false) {
                    return true;
                }
            }
            return false;
        }

        // Case 4: value and totalQuantity are both arrays
        if (is_array($value) && is_array($totalQuantity)) {
            foreach ($value as $val) {
                foreach ($totalQuantity as $qty) {
                    if (strpos((string)$qty, $val) !== false) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private function checkStartsWith($totalQuantity, $value)
    {
        // Case 1: Both value and totalQuantity are not arrays
        if (!is_array($value) && !is_array($totalQuantity)) {
            return strpos((string)$totalQuantity, $value) === 0;
        }

        // Case 2: Value is an array and totalQuantity is not
        if (is_array($value) && !is_array($totalQuantity)) {
            foreach ($value as $val) {
                if (strpos((string)$totalQuantity, $val) === 0) {
                    return true;
                }
            }
            return false;
        }

        // Case 3: Value is not an array and totalQuantity is an array
        if (!is_array($value) && is_array($totalQuantity)) {
            foreach ($totalQuantity as $qty) {
                if (strpos((string)$qty, $value) === 0) {
                    return true;
                }
            }
            return false;
        }

        // Case 4: Both value and totalQuantity are arrays
        if (is_array($value) && is_array($totalQuantity)) {
            foreach ($value as $val) {
                foreach ($totalQuantity as $qty) {
                    if (strpos((string)$qty, $val) === 0) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private function checkModular($totalQuantity, $value, $modular0)
    {
        foreach ((array)$totalQuantity as $qty) {
            if ($modular0 ? ($qty % $value !== 0) : ($qty % $value === 0)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Fetches data from Shopify product API.
     *
     * @param array $userData User data containing credentials and shop info
     * @param int $productId The product ID to fetch data for
     * @param string $field The specific field to retrieve from the product data
     * @return mixed The requested product field data
     */

    private function fetchShopifyProductData($userData, $productId, $field)
    {
        $apiVersion = config('services.shopify.api_version');
        $shopName = $userData['name'];
        $accessToken = $userData['password'];

        // Set up common headers
        $customHeaders = [
            'X-Shopify-Access-Token' => $accessToken,
            'Content-Type' => 'application/json',
        ];

        // Fetch product data using REST API
        $restEndpoint = "https://{$shopName}/admin/api/{$apiVersion}/products/{$productId}.json";
        $restResponse = Http::withHeaders($customHeaders)->get($restEndpoint);

        if ($restResponse->failed()) {
            return null;
        }

        $productData = $restResponse->json('product');

        // If the specific field is 'collections', fetch collection data using GraphQL
        if ($field === 'collections') {
            $collections = $this->fetchShopifyProductCollections($shopName, $apiVersion, $productId, $accessToken);
            return $collections;
        }

        return $productData[$field] ?? null;
    }

    private function fetchShopifyProductCollections($shopName, $apiVersion, $productId, $accessToken)
    {
        $query = <<<GRAPHQL
            {
                product(id: "gid://shopify/Product/{$productId}") {
                    collections(first: 10) {
                        edges {
                            node {
                                id
                                title
                            }
                        }
                    }
                }
            }
            GRAPHQL;

        $graphqlEndpoint = "https://{$shopName}/admin/api/{$apiVersion}/graphql.json";
        $graphqlResponse = Http::withHeaders([
            'X-Shopify-Access-Token' => $accessToken,
            'Content-Type' => 'application/json',
        ])->post($graphqlEndpoint, [
            'query' => $query,
        ]);

        if ($graphqlResponse->failed()) {
            return null;
        }

        $data = $graphqlResponse->json();
        $collections = $data['data']['product']['collections']['edges'] ?? [];

        // Extract the collection IDs and join them into a comma-separated string
        $collectionIds = array_map(function ($edge) {
            $expload = explode('/', $edge['node']['id']);
            return $expload[4];
        }, $collections);

        return implode(',', $collectionIds);
    }

    private function checkOtherCondition($array, $condition, $tags)
    {
        if (isset($condition) && is_array($array) && is_array($tags)) {
            $result = false;

            switch ($condition['per_product']) {
                case 'any':
                    // ANY product must satisfy this condition
                    $result = in_array(true, $array);
                    break;
                case 'all':
                    // ALL products must satisfy this condition
                    $result = !in_array(false, $array);
                    break;
                case 'none':
                    // NONE of the products must satisfy this condition
                    $result = !in_array(true, $array);
                    break;
                case 'anyTag':
                    // ANY product must satisfy this condition and have the specified tag
                    $resultTag = in_array(true, $array);
                    if ($resultTag) {
                        foreach ($tags as $tag) {
                            $tagArr = explode(',', $tag);
                            if (in_array(trim($condition['tag']), array_map('trim', $tagArr))) {
                                $result = true;
                                break;
                            }
                        }
                    }
                    break;
                case 'allTag':
                    // ALL products that satisfy this condition must have the specified tag
                    $resultTag = !in_array(false, $array);
                    if ($resultTag) {
                        $result = true;
                        foreach ($tags as $tag) {
                            $tagArr = explode(',', $tag);
                            if (!in_array(trim($condition['tag']), array_map('trim', $tagArr))) {
                                $result = false;
                                break;
                            }
                        }
                    }
                    break;
            }

            Log::info('Query logs:', [
                'condition' => $array,
                'condition_details' => $condition,
                'result' => $result
            ]);

            return $result;
        }

        return false; // Return false if condition is not properly set or if $array is not an array
    }

    private function arraysHaveCommonElement($array1, $array2)
    {
        return !empty(array_intersect($array1, $array2));
    }

    private function getCustomerByPhone($field, $customer_id)
    {
        if (empty($customer_id)) {
            return null;
        } else {
            $catchData = Cache::get($customer_id);
            Log::info('header logs:', ['catchData' => $catchData]);
            Log::info('header logs:', ['catchData' => $catchData['customer'][$field]]);

            if (empty($catchData)) {
                return null;
            } else {
                return $catchData['customer'][$field];
            }
        }
    }

    private function calculateSurcharge($basePrice, $amount, $unitFor, $chargePerWeight, $minChargePrice, $maxChargePrice, $baseUnit)
    {
        // Convert units to grams
        if (!is_null($baseUnit)) {
            $unitConversion = [
                'kg' => 1000,
                'lb' => 453.59237,
                'oz' => 28.35,
                // default is grams if no match
                'g'  => 1
            ];

            $newUnitFor = isset($unitConversion[$baseUnit]) ? $unitFor * $unitConversion[$baseUnit] : $unitFor;
        } else {
            $newUnitFor = $unitFor;
        }


        $totalSurcharge = $basePrice + ($amount / $newUnitFor * $chargePerWeight);

        if ($totalSurcharge < $minChargePrice) {
            $totalSurcharge = $minChargePrice;
        }

        if ($maxChargePrice != 0 && $totalSurcharge > $maxChargePrice) {
            $totalSurcharge = $maxChargePrice;
        }

        Log::info('Filtered conditions:', [
            'basePrice' => $basePrice,
            'amount' => $amount,
            'unitFor' => $unitFor,
            'newUnitFor' => $newUnitFor,
            'chargePerWeight' => $chargePerWeight,
            'minChargePrice' => $minChargePrice,
            'maxChargePrice' => $maxChargePrice,
            'totalSurcharge' => $totalSurcharge,
            'baseUnit' => $baseUnit,
        ]);

        return $totalSurcharge;
    }

    private function calculateSurchargeAlt($basePrice, $amount, $unitFor, $chargePerWeight, $minChargePrice, $maxChargePrice, $baseUnit = null)
    {
        // Convert units to grams if a base unit is provided
        $newUnitFor = $unitFor;
        if (!is_null($baseUnit)) {
            $unitConversion = [
                'kg' => 1000,
                'lb' => 453.59237,
                'oz' => 28.35,
                'g'  => 1 // Default is grams
            ];

            $newUnitFor *= $unitConversion[$baseUnit] ?? 1;
        }

        $calculation = 0;
        if ($amount > $newUnitFor) {
            $total = $amount - $newUnitFor;
            $calculation = !is_null($baseUnit) ? $total / ($unitConversion[$baseUnit] ?? 1) : $total;
        }

        $totalSurcharge = $basePrice + ($calculation * $chargePerWeight);

        // Ensure the surcharge is within the specified min and max limits
        $totalSurcharge = max($totalSurcharge, $minChargePrice);
        if ($maxChargePrice > 0) {
            $totalSurcharge = min($totalSurcharge, $maxChargePrice);
        }

        Log::info('Filtered conditions:', [
            'basePrice' => $basePrice,
            'amount' => $amount,
            'unitFor' => $unitFor,
            'newUnitFor' => $newUnitFor,
            'chargePerWeight' => $chargePerWeight,
            'minChargePrice' => $minChargePrice,
            'maxChargePrice' => $maxChargePrice,
            'totalSurcharge' => $totalSurcharge,
            'baseUnit' => $baseUnit,
        ]);

        return $totalSurcharge;
    }

    private function convertWeightUnit($baseUnit = 'kg', $unitPrice)
    {
        $newUnitFor = 0;
        $unitConversion = [
            'kg' => 1000,
            'lb' => 453.59237,
            'oz' => 28.35,
            'g'  => 1 // Default is grams
        ];

        $newUnitFor *= $unitConversion[$baseUnit] ?? 1;

        Log::info("newUnitFor", ["newUnitFor" => $baseUnit]);
        Log::info("newUnitFor", ["unitPrice" => $unitPrice]);

        return $unitPrice / ($unitConversion[$baseUnit] ?? 1) ?? 0;
    }


    public function handleCallback(Request $request, $customer_id = null)
    {
        $input = $request->input();

        Log::info('header logs:', ['customerData' => $customer_id]);
        // Log::info('header logs:', ['inputData' => $request->input()]);

        $shopDomain = $request->header();

        $companyName = $shopDomain['x-shopify-shop-domain'][0];

        $destinationCountryName = $input['rate']['destination']['country'];

        $items = $input['rate']['items'];

        $reqCurrency = $input['rate']['currency'];

        $localeCode = $input['rate']['locale'];
        $totalQuantity = array_sum(array_column($items, 'quantity'));
        $totalWeight = array_reduce($items, function ($carry, $item) {
            return $carry + ($item['grams'] * $item['quantity']);
        }, 0);

        $totalPrice1 = array_reduce($items, function ($carry, $item) {
            $itemTotal = ($item['price'] * $item['quantity']) / 100;
            return $carry + $itemTotal;
        }, 0);

        $totalPrice = round($totalPrice1, 2);

        $latitudeFrom = $input['rate']['origin']['latitude'];
        $longitudeFrom = $input['rate']['origin']['longitude'];
        $latitudeTo = $input['rate']['destination']['latitude'];
        $longitudeTo = $input['rate']['destination']['longitude'];

        $distance = DistanceHelper::haversineGreatCircleDistance(
            $latitudeFrom,
            $longitudeFrom,
            $latitudeTo,
            $longitudeTo
        );

        $destinationZipcode = $input['rate']['destination']['postal_code'];
        $destinationData = $input['rate']['destination'];
        $originData = $input['rate']['origin'];
        $destinationAddress = $input['rate']['destination']['address1'] . " " . $input['rate']['destination']['address2'];

        $userData = User::where('name', $companyName)->first();
        $userId = $userData->id;

        $setting = Setting::where('user_id', $userId)->first();
        $response = [];
        $mixMergeRate = MixMergeRate::where('user_id', $userId)->get();

        if (!empty($setting) && !$setting->status) {
            return response()->json($response);
        }

        $zoneIds = ZoneCountry::where('user_id', $userId)->where('countryCode', $destinationCountryName)->whereHas('zone', function ($query) use ($reqCurrency) {
            $query->where('status', 1)->where('currency', $reqCurrency);
        })->pluck('zone_id');

        $rates = Rate::whereIn('zone_id', $zoneIds)->where('user_id', $userId)->where('status', 1)->with('zone:id,currency', 'zipcode')->get();

        $filteredRates = $rates->map(function ($rate) use ($destinationData, $destinationZipcode, $totalQuantity, $totalWeight, $localeCode, $destinationAddress, $items, $totalPrice, $distance, $userData, $customer_id) {
            $zipcode = optional($rate->zipcode);
            // Check cart conditions
            $conditionsMet = false;
            switch ($rate->cart_condition['conditionMatch']) {
                case 0: // Return true for case 0
                    $conditionsMet = true;
                    break;
                case 1: // All conditions must be true
                    $conditionsMet = collect($rate->cart_condition['cartCondition'])->every(function ($condition) use ($totalQuantity, $totalWeight, $localeCode, $destinationData, $destinationAddress, $items, $totalPrice, $distance, $userData, $customer_id) {
                        Log::info("case 1");
                        if ($condition['label'] == 'Cart_Order') {
                            $currentTime = Carbon::now($userData['shop_timezone'])->format('H:i');
                            $currentDay = Carbon::now()->format('l');
                            $comparativeValue = null;

                            switch ($condition['name']) {
                                case 'quantity':
                                    $comparativeValue = $totalQuantity;
                                    break;
                                case 'weight':
                                    $comparativeValue = round($this->convertWeightUnit($condition['unit'], $totalWeight), 2);
                                    break;

                                case 'localcode':
                                    $comparativeValue = $localeCode;
                                    break;

                                case 'time':
                                    $comparativeValue = $currentTime;
                                    break;

                                case 'address':
                                    $comparativeValue = $destinationAddress;
                                    break;

                                case 'total':
                                    $comparativeValue = $totalPrice;
                                    break;

                                case 'lineitem':
                                    $comparativeValue = count($items);
                                    break;

                                case 'distance':
                                    $comparativeValue = $distance;
                                    break;

                                case 'day':
                                    $comparativeValue = $currentDay;
                                    break;

                                default:
                                    Log::error('Unknown condition name: ' . $condition['name']);
                                    break;
                            }

                            // Check the condition with the determined comparative value
                            return $this->checkCondition($condition, $comparativeValue);
                        }

                        if ($condition['label'] == 'Per_Product') {
                            $fieldMap = [
                                'quantity2' => 'quantity',
                                'price' => fn($item) => $item['price'] / 100,
                                'total2' => fn($item) => round(($item['price'] * $item['quantity']) / 100, 2),
                                'weight2' => 'grams',
                                'name' => 'name',
                                'tag' => fn($item) => $this->fetchShopifyProductData($userData, $item['product_id'], 'tags'),
                                'type' => fn($item) => $this->fetchShopifyProductData($userData, $item['product_id'], 'product_type'),
                                'sku' => 'sku',
                                'vendor' => 'vendor'
                            ];

                            if (array_key_exists($condition['name'], $fieldMap)) {
                                $perProductResult = [];
                                $perProductTag = [];
                                foreach ($items as $item) {
                                    $totalQuantity = is_callable($fieldMap[$condition['name']])
                                        ? $fieldMap[$condition['name']]($item)
                                        : $item[$fieldMap[$condition['name']]];

                                    if ($condition['name'] == 'weight2') {
                                        $totalQuantity = round($this->convertWeightUnit($condition['unit'], $totalQuantity), 2);
                                    }

                                    $perProductResult[] = $this->checkCondition($condition, $totalQuantity);
                                    $perProductTag[] = $this->fetchShopifyProductData($userData, $item['product_id'], 'tags');
                                }

                                if (!empty($perProductResult)) {
                                    return $this->checkOtherCondition($perProductResult, $condition, $perProductTag);
                                }

                                return true; // Return true if all items pass the condition
                            }
                        }

                        if ($condition['label'] == 'Customer') {
                            $fieldMap = [
                                'name2' => 'name',
                                'email' => 'email',
                                'phone' => 'phone',
                                'company' => 'company_name',
                                'address' => 'address1',
                                'addrss1' => 'address2',
                                'address2' => 'address3',
                                'city' => 'city',
                                'provinceCode' => 'province',
                                'tag2' => fn($item) => $this->getCustomerByPhone('tags', $customer_id),
                                'previousCount' => fn($item) => $this->getCustomerByPhone('orders_count', $customer_id),
                                'previousSpent' => fn($item) => $this->getCustomerByPhone('total_spent', $customer_id),
                            ];

                            if (array_key_exists($condition['name'], $fieldMap)) {
                                $field = $fieldMap[$condition['name']];
                                // Determine if the field or callback is callable
                                $totalQuantity = is_callable($field)
                                    ? $field($destinationData)
                                    : ($destinationData[$field] ?? null);

                                return $this->checkCondition($condition, $totalQuantity);
                            }
                        }

                        if ($condition['label'] == 'Delivery') {

                            if ($condition['name'] == 'dayOfWeek') {
                                $day = Carbon::createFromFormat('Y-m-d', date('Y-m-d'))->format('l');
                                $totalQuantity = $day;
                            }

                            if ($condition['name'] == 'dayIs') {
                                $totalQuantity = Carbon::now()->format('d');
                            }

                            if ($condition['name'] == 'date') {
                                $totalQuantity = Carbon::today()->format('d-m-Y');
                            }

                            if ($condition['name'] == 'timeIn') {
                                $totalQuantity = Carbon::now($userData['shop_timezone'])->format('H:i');
                            }

                            if ($condition['name'] == 'deliveryType') {
                                $totalQuantity = "Shipping";
                            }

                            return $this->checkCondition($condition, $totalQuantity);
                        }
                        return true;
                    });
                    break;
                case 2: // Any condition must be true
                    $conditionsMet = collect($rate->cart_condition['cartCondition'])->some(function ($condition) use ($totalQuantity, $totalWeight, $localeCode, $destinationData, $destinationAddress, $items, $totalPrice, $distance, $userData, $customer_id) {
                        Log::info("case 2");
                        if ($condition['label'] == 'Cart_Order') {

                            $currentTime = Carbon::now($userData['shop_timezone'])->format('H:i');;
                            $currentDay = Carbon::now()->format('l');
                            $comparativeValue = null;

                            switch ($condition['name']) {
                                case 'quantity':
                                    $comparativeValue = $totalQuantity;
                                    break;

                                case 'weight':
                                    $comparativeValue = round($this->convertWeightUnit($condition['unit'], $totalWeight), 2);
                                    break;

                                case 'localcode':
                                    $comparativeValue = $localeCode;
                                    break;

                                case 'time':
                                    $comparativeValue = $currentTime;
                                    break;

                                case 'address':
                                    $comparativeValue = $destinationAddress;
                                    break;

                                case 'total':
                                    $comparativeValue = $totalPrice;
                                    break;

                                case 'lineitem':
                                    $comparativeValue = count($items);
                                    break;

                                case 'distance':
                                    $comparativeValue = $distance;
                                    break;

                                case 'day':
                                    $comparativeValue = $currentDay;
                                    break;

                                default:
                                    Log::error('Unknown condition name: ' . $condition['name']);
                                    break;
                            }

                            // Check the condition with the determined comparative value
                            return $this->checkCondition($condition, $comparativeValue);
                        }

                        if ($condition['label'] == 'Per_Product') {
                            $fieldMap = [
                                'quantity2' => 'quantity',
                                'price' => fn($item) => $item['price'] / 100,
                                'total2' => fn($item) => round(($item['price'] * $item['quantity']) / 100, 2),
                                'weight2' => 'grams',
                                'name' => 'name',
                                'tag' => fn($item) => $this->fetchShopifyProductData($userData, $item['product_id'], 'tags'),
                                'type' => fn($item) => $this->fetchShopifyProductData($userData, $item['product_id'], 'product_type'),
                                'sku' => 'sku',
                                'vendor' => 'vendor'
                            ];

                            if (array_key_exists($condition['name'], $fieldMap)) {
                                $perProductResult = [];
                                $perProductTag = [];
                                foreach ($items as $item) {
                                    $totalQuantity = is_callable($fieldMap[$condition['name']])
                                        ? $fieldMap[$condition['name']]($item)
                                        : $item[$fieldMap[$condition['name']]];

                                    if ($condition['name'] == 'weight2') {
                                        $totalQuantity = round($this->convertWeightUnit($condition['unit'], $totalQuantity), 2);
                                    }

                                    $perProductResult[] = $this->checkCondition($condition, $totalQuantity);
                                    $perProductTag[] = $this->fetchShopifyProductData($userData, $item['product_id'], 'tags');
                                }

                                if (!empty($perProductResult)) {
                                    return $this->checkOtherCondition($perProductResult, $condition, $perProductTag);
                                }

                                return true; // Return true if all items pass the condition
                            }
                        }

                        if ($condition['label'] == 'Customer') {
                            $fieldMap = [
                                'name2' => 'name',
                                'email' => 'email',
                                'phone' => 'phone',
                                'company' => 'company_name',
                                'address' => 'address1',
                                'addrss1' => 'address2',
                                'address2' => 'address3',
                                'city' => 'city',
                                'provinceCode' => 'province',
                                'tag2' => fn($item) => $this->getCustomerByPhone('tags', $customer_id),
                                'previousCount' => fn($item) => $this->getCustomerByPhone('orders_count', $customer_id),
                                'previousSpent' => fn($item) => $this->getCustomerByPhone('total_spent', $customer_id),
                            ];

                            if (array_key_exists($condition['name'], $fieldMap)) {
                                $field = $fieldMap[$condition['name']];
                                // Determine if the field or callback is callable
                                $totalQuantity = is_callable($field)
                                    ? $field($destinationData)
                                    : ($destinationData[$field] ?? null);

                                return $this->checkCondition($condition, $totalQuantity);
                            }
                        }

                        if ($condition['label'] == 'Delivery') {

                            if ($condition['name'] == 'dayOfWeek') {
                                $currentDay = Carbon::now()->format('l');
                                $totalQuantity = $currentDay;
                            }

                            if ($condition['name'] == 'dayIs') {
                                $totalQuantity = Carbon::now()->format('d');
                            }

                            if ($condition['name'] == 'date') {
                                $totalQuantity = Carbon::today()->format('d-m-Y');
                            }

                            if ($condition['name'] == 'timeIn') {
                                $totalQuantity = Carbon::now($userData['shop_timezone'])->format('H:i');
                            }

                            if ($condition['name'] == 'deliveryType') {
                                $totalQuantity = "Shipping";
                            }

                            return $this->checkCondition($condition, $totalQuantity);
                        }

                        return true;
                    });
                    break;
                case 3: // All conditions must be false to return true, if any condition is true return false
                    $conditionsMet = !collect($rate->cart_condition['cartCondition'])->some(function ($condition) use ($totalQuantity, $totalWeight, $localeCode, $destinationData, $destinationAddress, $items, $totalPrice, $distance, $userData, $customer_id) {
                        Log::info("case 3");
                        if ($condition['label'] == 'Cart_Order') {

                            $currentTime = Carbon::now($userData['shop_timezone'])->format('H:i');
                            $currentDay = Carbon::now()->format('l');
                            $comparativeValue = null;

                            switch ($condition['name']) {
                                case 'quantity':
                                    $comparativeValue = $totalQuantity;
                                    break;

                                case 'weight':
                                    $comparativeValue = round($this->convertWeightUnit($condition['unit'], $totalWeight), 2);
                                    break;

                                case 'localcode':
                                    $comparativeValue = $localeCode;
                                    break;

                                case 'time':
                                    $comparativeValue = $currentTime;
                                    break;

                                case 'address':
                                    $comparativeValue = $destinationAddress;
                                    break;

                                case 'total':
                                    $comparativeValue = $totalPrice;
                                    break;

                                case 'lineitem':
                                    $comparativeValue = count($items);
                                    break;

                                case 'distance':
                                    $comparativeValue = $distance;
                                    break;

                                case 'day':
                                    $comparativeValue = $currentDay;
                                    break;

                                default:
                                    Log::error('Unknown condition name: ' . $condition['name']);
                                    break;
                            }

                            // Check the condition with the determined comparative value
                            return $this->checkCondition($condition, $comparativeValue);
                        }

                        if ($condition['label'] == 'Per_Product') {
                            $fieldMap = [
                                'quantity2' => 'quantity',
                                'price' => fn($item) => $item['price'] / 100,
                                'total2' => fn($item) => round(($item['price'] * $item['quantity']) / 100, 2),
                                'weight2' => 'grams',
                                'name' => 'name',
                                'tag' => fn($item) => $this->fetchShopifyProductData($userData, $item['product_id'], 'tags'),
                                'type' => fn($item) => $this->fetchShopifyProductData($userData, $item['product_id'], 'product_type'),
                                'sku' => 'sku',
                                'vendor' => 'vendor'
                            ];

                            if (array_key_exists($condition['name'], $fieldMap)) {
                                $perProductResult = [];
                                $perProductTag = [];
                                foreach ($items as $item) {
                                    $totalQuantity = is_callable($fieldMap[$condition['name']])
                                        ? $fieldMap[$condition['name']]($item)
                                        : $item[$fieldMap[$condition['name']]];

                                    if ($condition['name'] == 'weight2') {
                                        $totalQuantity = round($this->convertWeightUnit($condition['unit'], $totalQuantity), 2);
                                    }

                                    $perProductResult[] = $this->checkCondition($condition, $totalQuantity);
                                    $perProductTag[] = $this->fetchShopifyProductData($userData, $item['product_id'], 'tags');
                                }

                                if (!empty($perProductResult)) {
                                    return $this->checkOtherCondition($perProductResult, $condition, $perProductTag);
                                }

                                return true; // Return true if all items pass the condition
                            }
                        }

                        if ($condition['label'] == 'Customer') {
                            $fieldMap = [
                                'name2' => 'name',
                                'email' => 'email',
                                'phone' => 'phone',
                                'company' => 'company_name',
                                'address' => 'address1',
                                'addrss1' => 'address2',
                                'address2' => 'address3',
                                'city' => 'city',
                                'provinceCode' => 'province',
                                'tag2' => fn($item) => $this->getCustomerByPhone('tags', $customer_id),
                                'previousCount' => fn($item) => $this->getCustomerByPhone('orders_count', $customer_id),
                                'previousSpent' => fn($item) => $this->getCustomerByPhone('total_spent', $customer_id),
                            ];

                            if (array_key_exists($condition['name'], $fieldMap)) {
                                $field = $fieldMap[$condition['name']];
                                // Determine if the field or callback is callable
                                $totalQuantity = is_callable($field)
                                    ? $field($destinationData)
                                    : ($destinationData[$field] ?? null);

                                return $this->checkCondition($condition, $totalQuantity);
                            }
                        }

                        if ($condition['label'] == 'Delivery') {

                            if ($condition['name'] == 'dayOfWeek') {
                                $currentDay = Carbon::now()->format('l');
                                $totalQuantity = $currentDay;
                            }

                            if ($condition['name'] == 'dayIs') {
                                $totalQuantity = Carbon::now()->format('d');
                            }

                            if ($condition['name'] == 'date') {
                                $totalQuantity = Carbon::today()->format('d-m-Y');
                            }

                            if ($condition['name'] == 'timeIn') {
                                $totalQuantity = Carbon::now($userData['shop_timezone'])->format('H:i');
                            }

                            if ($condition['name'] == 'deliveryType') {
                                $totalQuantity = "Shipping";
                            }

                            return $this->checkCondition($condition, $totalQuantity);
                        }

                        return true;
                    });
                    break;
            }

            //Log the conditions and the result of the check
            Log::info('Filtered conditions:', [
                'rate_id' => $rate->id,
                'conditionsMet' => $conditionsMet,
            ]);

            // If the conditions are not met, return null
            if (!$conditionsMet) {
                return null;
            }

            // Check state selection
            if ($zipcode->stateSelection === 'Custom') {
                $states = collect($zipcode->state)->pluck('code')->all();
                if (!in_array($destinationData['province'], $states)) {
                    return null;
                }
            }

            // Check zipcode selection
            if ($zipcode->zipcodeSelection === 'Custom') {
                $zipcodes = $zipcode->zipcode;
                if ($zipcode->isInclude === 'Include') {
                    if (!in_array($destinationZipcode, $zipcodes)) {
                        return null;
                    }
                } elseif ($zipcode->isInclude === 'Exclude') {
                    if (in_array($destinationZipcode, $zipcodes)) {
                        return null;
                    }
                }
            }

            //rate_based_on_surcharge
            if (!empty($rate->rate_based_on_surcharge) && $rate->rate_based_on_surcharge['based_on_cart']) {
                $surcharge = $rate->rate_based_on_surcharge;

                if (isset($surcharge['charge_per_wight'])) {
                    $surcharge['charge_per_weight'] = $surcharge['charge_per_wight'];
                }

                $minChargePrice = isset($surcharge['min_charge_price']) ? $surcharge['min_charge_price'] : 0;
                $maxChargePrice = isset($surcharge['max_charge_price']) ? $surcharge['max_charge_price'] : 0;

                switch ($surcharge['cart_and_product_surcharge']) {
                    case 'weight':
                        if ($surcharge['selectedByAmount'] == 'unit') {
                            $rate->base_price = $this->calculateSurcharge($rate->base_price, $totalWeight, $surcharge['unit_for'], $surcharge['charge_per_weight'], $minChargePrice, $maxChargePrice, $surcharge['base_weight_unit']);
                        } else {
                            $rate->base_price = $this->calculateSurchargeAlt($rate->base_price, $totalWeight, $surcharge['unit_for'], $surcharge['charge_per_weight'], $minChargePrice, $maxChargePrice, $surcharge['base_weight_unit']);
                        }
                        break;

                    case 'Qty':
                        if ($surcharge['selectedByAmount'] == 'unit') {
                            $rate->base_price = $this->calculateSurcharge($rate->base_price, $totalQuantity, $surcharge['unit_for'], $surcharge['charge_per_weight'], $minChargePrice, $maxChargePrice, null);
                        } else {
                            $rate->base_price = $this->calculateSurchargeAlt($rate->base_price, $totalQuantity, $surcharge['unit_for'], $surcharge['charge_per_weight'], $minChargePrice, $maxChargePrice, null);
                        }
                        break;

                    case 'Distance':
                        if ($surcharge['selectedByAmount'] == 'unit') {
                            $rate->base_price = $this->calculateSurcharge($rate->base_price, $distance, $surcharge['unit_for'], $surcharge['charge_per_weight'], $minChargePrice, $maxChargePrice, null);
                        } else {
                            $rate->base_price = $this->calculateSurchargeAlt($rate->base_price, $distance, $surcharge['unit_for'], $surcharge['charge_per_weight'], $minChargePrice, $maxChargePrice, null);
                        }
                        break;

                    case 'Percentage':
                        $rate->base_price += $rate->base_price * $surcharge['cart_total_percentage'] / 100;
                        if ($rate->base_price < $minChargePrice) {
                            $rate->base_price = $minChargePrice;
                        } elseif ($maxChargePrice != 0 && $rate->base_price > $maxChargePrice) {
                            $rate->base_price = $maxChargePrice;
                        }
                        break;
                    case 'Product':
                        $surchargeData = collect($surcharge['productData']);
                        $itemsProductIds = collect($items)->pluck('product_id');

                        // Filter the surcharge data to only include items with matching product_id
                        $filteredData = $surchargeData->filter(function ($item) use ($itemsProductIds) {
                            return $itemsProductIds->contains($item['id']);
                        });

                        $filteredDataWithQuantity = $filteredData->map(function ($item) use ($items) {
                            $quantity = collect($items)->firstWhere('product_id', $item['id'])['quantity'] ?? 0;
                            $item['quantity'] = $quantity;
                            return $item;
                        })->toArray();

                        $lastFilteredData = collect($filteredDataWithQuantity)->last();

                        Log::info('lastFilteredData:', ['lastFilteredData' => $lastFilteredData]);

                        if ($surcharge['selectedMultiplyLine'] == 'Yes' && !empty($lastFilteredData)) {
                            $rate->base_price = $rate->base_price + ($lastFilteredData['value'] * $lastFilteredData['quantity']);
                        } elseif ($surcharge['selectedMultiplyLine'] == 'per' && !empty($lastFilteredData)) {
                            $rate->base_price = $rate->base_price + $lastFilteredData['value'] + (($lastFilteredData['price'] % $surcharge['cart_total_percentage'] / 100) * $lastFilteredData['quantity']);
                            if ($rate->base_price < $minChargePrice && $minChargePrice != 0) {
                                $rate->base_price = $minChargePrice;
                            } elseif ($maxChargePrice != 0 && $rate->base_price > $maxChargePrice) {
                                $rate->base_price = $maxChargePrice;
                            }
                        }
                        break;
                    case 'Vendor':
                        $itemsProductIds = collect($items)->pluck('vendor');

                        $vendorsCommaSeparated = $itemsProductIds->implode(', ');

                        $conditions = [
                            'condition' => "equal",
                            'value' => $surcharge['descriptions']
                        ];

                        if ($this->checkCondition($conditions, $vendorsCommaSeparated)) {
                            if ($surcharge['selectedMultiplyLine'] == 'Yes') {
                                $rate->base_price = $rate->base_price;
                            } elseif ($surcharge['selectedMultiplyLine'] == 'per') {
                                $rate->base_price = $rate->base_price + ($rate->base_price * $surcharge['cart_total_percentage'] / 100);
                                if ($rate->base_price < $minChargePrice && $minChargePrice != 0) {
                                    $rate->base_price = $minChargePrice;
                                } elseif ($maxChargePrice != 0 && $rate->base_price > $maxChargePrice) {
                                    $rate->base_price = $maxChargePrice;
                                }
                            }
                        } else {
                            return null;
                        }
                        break;
                    case 'Tag':
                        $allTags = [];

                        foreach ($items as $item) {
                            $tags = $this->fetchShopifyProductData($userData, $item['product_id'], 'tags');
                            $newtags = explode(',', $tags);
                            if (is_array($newtags)) {
                                $allTags = array_merge($allTags, $newtags);
                            }
                        }
                        // Remove duplicate tags and join them into a comma-separated string
                        $uniqueTags = array_unique($allTags);
                        $tagsCommaSeparated = implode(', ', $uniqueTags);

                        $conditions = [
                            'condition' => "equal",
                            'value' => $surcharge['descriptions']
                        ];

                        if ($this->checkCondition($conditions, $tagsCommaSeparated)) {
                            if ($surcharge['selectedMultiplyLine'] == 'Yes') {
                                $rate->base_price = $rate->base_price;
                            } elseif ($surcharge['selectedMultiplyLine'] == 'per') {
                                $rate->base_price = $rate->base_price + ($rate->base_price * $surcharge['cart_total_percentage'] / 100);
                                if ($rate->base_price < $minChargePrice && $minChargePrice != 0) {
                                    $rate->base_price = $minChargePrice;
                                } elseif ($maxChargePrice != 0 && $rate->base_price > $maxChargePrice) {
                                    $rate->base_price = $maxChargePrice;
                                }
                            }
                        } else {
                            return null;
                        }
                        break;
                    case 'Type':
                        $allType = [];

                        foreach ($items as $item) {
                            $types = $this->fetchShopifyProductData($userData, $item['product_id'], 'product_type');
                            $newtypes = explode(',', $types);
                            if (is_array($newtypes)) {
                                $allType = array_merge($allType, $newtypes);
                            }
                        }
                        // Remove duplicate tags and join them into a comma-separated string
                        $uniqueTypes = array_unique($allType);
                        $commaSeparated = implode(', ', $uniqueTypes);

                        $conditions = [
                            'condition' => "equal",
                            'value' => $surcharge['descriptions']
                        ];

                        if ($this->checkCondition($conditions, $commaSeparated)) {
                            if ($surcharge['selectedMultiplyLine'] == 'Yes') {
                                $rate->base_price = $rate->base_price;
                            } elseif ($surcharge['selectedMultiplyLine'] == 'per') {
                                $rate->base_price = $rate->base_price + ($rate->base_price * $surcharge['cart_total_percentage'] / 100);
                                if ($rate->base_price < $minChargePrice && $minChargePrice != 0) {
                                    $rate->base_price = $minChargePrice;
                                } elseif ($maxChargePrice != 0 && $rate->base_price > $maxChargePrice) {
                                    $rate->base_price = $maxChargePrice;
                                }
                            }
                        } else {
                            return null;
                        }
                        break;
                    case 'Collection':
                        $allCollection = [];

                        foreach ($items as $item) {
                            $types = $this->fetchShopifyProductData($userData, $item['product_id'], 'collections');
                            $newcollections = explode(',', $types);
                            if (is_array($newcollections)) {
                                $allCollection = array_merge($allCollection, $newcollections);
                            }
                        }
                        // Remove duplicate tags and join them into a comma-separated string
                        $uniqueCollections = array_unique($allCollection);
                        $commaSeparated = implode(', ', $uniqueCollections);

                        $conditions = [
                            'condition' => "equal",
                            'value' => $surcharge['descriptions']
                        ];

                        if ($this->checkCondition($conditions, $commaSeparated)) {
                            if ($surcharge['selectedMultiplyLine'] == 'Yes') {
                                $rate->base_price = $rate->base_price;
                                Log::info('option1:', ['option1' => $rate->base_price]);
                            } elseif ($surcharge['selectedMultiplyLine'] == 'per') {
                                $rate->base_price = $rate->base_price + ($rate->base_price * $surcharge['cart_total_percentage'] / 100);
                                if ($rate->base_price < $minChargePrice && $minChargePrice != 0) {
                                    $rate->base_price = $minChargePrice;
                                } elseif ($maxChargePrice != 0 && $rate->base_price > $maxChargePrice) {
                                    $rate->base_price = $maxChargePrice;
                                }
                            }
                        } else {
                            return null;
                        }
                        break;
                    case 'SKU':
                        $itemsProductSKU = collect($items)->pluck('sku');

                        $skuCommaSeparated = $itemsProductSKU->implode(', ');

                        $conditions = [
                            'condition' => "equal",
                            'value' => $surcharge['descriptions']
                        ];

                        if ($this->checkCondition($conditions, $skuCommaSeparated)) {
                            if ($surcharge['selectedMultiplyLine'] == 'Yes') {
                                $rate->base_price = $rate->base_price;
                            } elseif ($surcharge['selectedMultiplyLine'] == 'per' && !empty($lastFilteredData)) {
                                $rate->base_price = $rate->base_price + ($rate->base_price * $surcharge['cart_total_percentage'] / 100);
                                if ($rate->base_price < $minChargePrice && $minChargePrice != 0) {
                                    $rate->base_price = $minChargePrice;
                                } elseif ($maxChargePrice != 0 && $rate->base_price > $maxChargePrice) {
                                    $rate->base_price = $maxChargePrice;
                                }
                            }
                        } else {
                            return null;
                        }
                        break;
                    default:
                        // Handle unknown surcharge type Vendor
                        break;
                }
            }

            // tier_type
            if (!empty($rate->rate_tier) && $rate->rate_tier['tier_type'] !== 'selected') {
                $baseUnitTier = $rate->rate_tier['unit'] ?? 'kg';

                if ($rate->rate_tier['tier_type'] == 'order_price') {
                    foreach ($rate->rate_tier['rateTier'] as $tier) {
                        $checkRateTier = $totalPrice >= $tier['minWeight'] && $totalPrice <= $tier['maxWeight'];
                        $perItem = isset($tier['perItem']) ? $totalQuantity * $tier['perItem'] : 0;
                        $percentCharge = isset($tier['percentCharge']) ? $totalPrice * $tier['percentCharge'] / 100 : 0;
                        $perkg = isset($tier['perkg']) ? $this->convertWeightUnit($baseUnitTier, $totalWeight) * $tier['perkg'] : 0;

                        if ($checkRateTier) {
                            $rate->base_price = $tier['basePrice'] + $perItem + $percentCharge + $perkg;
                            // Log::info("checkRateTier", [
                            //     "basePrice"=>$tier['basePrice'],
                            //     "perItem"=>$perItem,
                            //     "percentCharge"=>$percentCharge,
                            //     "perkg"=>$perkg,
                            //     "perkg1"=>$tier['perkg'],
                            //     "perkg2"=>$this->convertWeightUnit($baseUnitTier, $totalWeight),
                            //     "totalWeight"=>$totalWeight,
                            //     "base_price"=>$rate->base_price,
                            //     "totalPrice"=>$totalPrice,
                            // ]);
                        }
                    }
                } else {
                    $matchValue = 0;
                    if ($rate->rate_tier['tier_type'] == 'order_quantity') {
                        $matchValue = $totalQuantity;
                    } else if ($rate->rate_tier['tier_type'] == 'order_weight') {
                        $matchValue = $this->convertWeightUnit($rate->rate_tier['unit'], $totalWeight);
                    } else if ($rate->rate_tier['tier_type'] == 'order_distance') {
                        $matchValue = $distance;
                    }
                    Log::info("tier_type", ["tier_type" => $matchValue]);
                    foreach ($rate->rate_tier['rateTier'] as $tier) {
                        $checkRateTier = $matchValue >= $tier['minWeight'] && $matchValue <= $tier['maxWeight'];
                        if ($checkRateTier) {
                            $rate->base_price = $tier['basePrice'];
                        }
                    }
                }
            }

            // Exclude rate for products
            if (!empty($rate->exclude_rate_for_products) && $rate->exclude_rate_for_products['set_exclude_products'] !== 'selected') {
                $excludeProducts = $rate->exclude_rate_for_products;
                // if (isset($excludeProducts['exclude_products_radio']) && $excludeProducts['exclude_products_radio']) {
                //     dd($excludeProducts);
                // }

                if (!$excludeProducts['exclude_products_radio']) {
                    if ($excludeProducts['set_exclude_products'] == 'product_vendor') {
                        $excludeProducts['set_exclude_products'] = 'vendor';
                    } else if ($excludeProducts['set_exclude_products'] == 'custome_selection') {
                        if (isset($excludeProducts['productsData'])) {
                            $collection = collect($excludeProducts['productsData']);

                            $productIds = $collection->pluck('id')->implode(',');
                        }
                        $excludeProducts['exclude_products_textbox'] = isset($productIds) ? $productIds : "0";
                        $excludeProducts['set_exclude_products'] = 'id';
                    }

                    $excludeType = $excludeProducts['set_exclude_products'];
                    $excludeText = explode(',', $excludeProducts['exclude_products_textbox']);

                    Log::info('Filtered conditions:', [
                        'productData' => $excludeText
                    ]);

                    foreach ($items as $item) {
                        $productData = ($excludeType != 'product_sku') ?
                            $this->fetchShopifyProductData($userData, $item['product_id'], $excludeType) :
                            $item['sku'];

                        if ($this->arraysHaveCommonElement($excludeText, explode(',', $productData))) {
                            return null;
                        }
                    }
                }
            }

            // Rate Modifiers
            if (!empty($rate->rate_modifiers) && is_array($rate->rate_modifiers)) {

                $modifierArray = [
                    'dayOfOrder' => fn() => Carbon::now()->format('l'),
                    'time' => fn() => Carbon::now($userData['shop_timezone'])->format('H:i'),
                    'price' => fn() => $totalPrice,
                    'weight' => fn() => $totalWeight,
                    'quantity' => fn() => $totalQuantity,
                    'distance' => fn() => $distance,
                    'localCode' => fn() => $localeCode,
                    'zipcode' => fn() => $destinationZipcode,
                    'name' => fn() => $destinationData['name'],
                    'city' => fn() => $destinationData['city'],
                    'provinceCode' => fn() => $destinationData['province'],
                    'address' => fn() => $destinationData['address1'],
                    'day' => fn($day) => Carbon::now()->addDay($day)->format('l'),
                    'date' => fn($day) => Carbon::now()->addDay($day)->format('Y-m-d'),
                    'dayFromToday' => fn($day) => $day,
                    'type' => fn() => "shipping",
                    'estimatedDay' => fn() => Carbon::now()->addDay()->format('l'),
                    'timefromCurrent' => fn() => null,
                    'available' => fn() => true,
                    'tag2' => fn($item) => $this->getCustomerByPhone('tags', $customer_id),
                ];

                $perProductArr = [
                    'availableQuan' => 'quantity',
                    'ids' => 'product_id',
                    'title' => 'name',
                    'tag' => fn($item) => $this->fetchShopifyProductData($userData, $item['product_id'], 'tags'),
                    'type2' => fn($item) => $this->fetchShopifyProductData($userData, $item['product_id'], 'product_type'),
                    'collectionsIds' => fn($item) => $this->fetchShopifyProductData($userData, $item['product_id'], 'collections'),
                    'sku' => 'sku',
                    'vendor' => 'vendor'
                ];

                foreach ($rate->rate_modifiers as $modifier) {
                    $isApplicable = false;

                    if (empty($modifier['rateDay']) && !empty($modifier['productData']) && $modifier['rateModifier'] == 'ids') {
                        $productData = collect($modifier['productData'])->pluck('id')->filter()->all();
                        $modifier['rateDay'] = $productData;
                    }

                    if (empty($modifier['rateDay2']) && !empty($modifier['productData2']) && $modifier['rateModifier2'] == 'ids') {
                        $productData = collect($modifier['productData2'])->pluck('id')->filter()->all();
                        $modifier['rateDay2'] = $productData;
                    }

                    $conditions = [
                        [
                            'condition' => $modifier['rateOperator'],
                            'value' => $modifier['rateDay'],
                            'modifier' => $modifier['rateModifier'],
                            'label' => $modifier['label1'],
                            'xDay' => $modifier['rateDay'],
                            'rateModifier' => $modifier['rateModifier'],
                            'unit' => $modifier['unit'] ?? 'kg'
                        ],
                    ];

                    // Log::info("conditions", ["conditions"=>$conditions]);

                    if ($modifier['type'] === 'AND' || $modifier['type'] === 'OR') {
                        if (isset($modifier['rateOperator2'], $modifier['rateDay2'], $modifier['rateModifier2'])) {
                            $conditions[] = [
                                'condition' => $modifier['rateOperator2'],
                                'value' => $modifier['rateDay2'],
                                'modifier' => $modifier['rateModifier2'],
                                'label' => $modifier['label2'],
                                'xDay' => $modifier['rateDay2'],
                                'rateModifier' => $modifier['rateModifier2'],
                                'unit' => $modifier['unit'] ?? 'kg'
                            ];
                        }
                    }

                    $results = array_map(function ($condition) use ($modifierArray, $modifier, $items, $userData, $perProductArr) {
                        if ($condition['label'] == 'any_Product') {
                            if (array_key_exists($condition['modifier'], $perProductArr)) {
                                foreach ($items as $item) {
                                    $totalQuantity = is_callable($perProductArr[$condition['modifier']]) ? $perProductArr[$condition['modifier']]($item) : $item[$perProductArr[$condition['modifier']]];

                                    Log::info('totalQuantity', ['totalQuantity' => $condition['condition']]);

                                    $resultStatus = $this->checkCondition($condition, $totalQuantity);

                                    if ($condition['condition'] == 'contains' && $resultStatus) {
                                        return true; // Return true as soon as any item meets the condition
                                    } else if ($condition['condition'] == 'notcontains' && $resultStatus) {
                                        return false;
                                    } else if ($resultStatus) {
                                        Log::info("notcontains Section last");
                                        return true;
                                    }
                                }
                            }
                            return false; // Return false if no items meet the condition
                        } else {
                            if (array_key_exists($condition['modifier'], $modifierArray)) {
                                // $currentValue = $modifierArray[$condition['modifier']]();
                                if (strpos($modifier['title'], "#") !== false) {
                                    $deliveryDay = str_replace('#', '', $modifier['title']);
                                } else if ($condition['modifier'] == 'dayFromToday') {
                                    $deliveryDay = $condition['xDay'];
                                    $condition['value'] = str_replace('#', '', $modifier['title']);
                                } else {
                                    $deliveryDay = 0;
                                }

                                $currentValue = is_callable($modifierArray[$condition['modifier']])
                                    ? $modifierArray[$condition['modifier']]($deliveryDay)
                                    : $modifierArray[$condition['modifier']]();

                                if ($condition['rateModifier'] == "weight") {
                                    Log::info("currentValue", ["currentValue" => $currentValue]);
                                    $currentValue = $this->convertWeightUnit($condition['unit'], $currentValue);
                                    Log::info("currentValue", ["currentValue" => $currentValue]);
                                }

                                return $this->checkCondition($condition, $currentValue);
                            }
                            return false;
                        }

                        return false; // Default return false if no conditions are met
                    }, $conditions);

                    switch ($modifier['type']) {
                        case 'None':
                            $isApplicable = $results[0];
                            break;
                        case 'AND':
                            $isApplicable = !in_array(false, $results, true);
                            break;
                        case 'OR':
                            $isApplicable = in_array(true, $results, true);
                            break;
                    }

                    if ($isApplicable) {
                        $rate->name = $modifier['name'];
                        $rate->description = $modifier['title'];
                        $adjustment = $modifier['adjustment'];

                        switch ($modifier['modifierType']) {
                            case 'Fixed':
                                $rate->base_price += $modifier['effect'] === 'Increase' ? $adjustment : -$adjustment;
                                break;

                            case 'Percentage':
                                $rateAdjustment = $rate->base_price * $adjustment / 100;
                                $rate->base_price += $modifier['effect'] === 'Increase' ? $rateAdjustment : -$rateAdjustment;
                                break;

                            case 'Static':
                                $rate->base_price = $adjustment;
                                break;

                            case 'RemoveRate':
                                return null;

                            case 'ShowOnly':
                                return $rate;

                            default:
                                return true;
                        }
                    }
                    if ($modifier['behaviour'] == 'Terminate') {
                        return $rate;
                    }
                }
            }

            // Origin Locations
            if (!empty($rate->origin_locations)) {
                foreach ($rate->origin_locations['updated_location'] as $location) {
                    if (strpos($location['address'], $destinationData['address1']) !== false) {
                        return $rate;
                    }
                }
            }

            // Schedule Rate => This rate is only available on a specific date & time
            if ($rate->schedule_rate) {
                if (!empty($rate->schedule_start_date_time) && !empty($rate->schedule_end_date_time)) {
                    $currentDateTime = Carbon::now()->format('d-m-Y H:i A');
                    $checkScheduleDateTime = $currentDateTime >= $rate->schedule_start_date_time && $currentDateTime <= $rate->schedule_end_date_time;
                    if (!$checkScheduleDateTime) {
                        return null;
                    }
                }
            }

            return $rate;
        })->filter();

        foreach ($filteredRates as $key => $rate) {
            // Check if 'send_another_rate' exists and its flag is true
            if (!empty($rate->send_another_rate['send_another_rate'])) {

                // Initialize the final price
                $finalTotalPrice = $rate->base_price;
                $adjustmentPrice = $rate->send_another_rate['adjustment_price'];
                $isPercentage = $rate->send_another_rate['update_price_type'] == 1;
                $isNegativeEffect = $rate->send_another_rate['update_price_effect'];

                // Apply the adjustment based on the type
                if ($rate->send_another_rate['update_price_type'] == 0) {
                    // Flat amount adjustment
                    $finalTotalPrice += $isNegativeEffect ? -$adjustmentPrice : $adjustmentPrice;
                } elseif ($isPercentage) {
                    // Percentage adjustment
                    $percentageAdjustment = $rate->base_price * ($adjustmentPrice / 100);
                    $finalTotalPrice += $isNegativeEffect ? -$percentageAdjustment : $percentageAdjustment;
                } else {
                    // Override base price completely
                    $finalTotalPrice = $adjustmentPrice;
                }

                // Create a new object for the adjusted rate or overwrite the existing rate object
                $adjustedRate = new \stdClass();
                $adjustedRate->name = $rate->send_another_rate['another_rate_name'] ?? 'Default Service Name';
                $adjustedRate->service_code = $rate->send_another_rate['another_service_code'] ?? 'Default Service Code';
                $adjustedRate->base_price = $finalTotalPrice; // Convert to cents
                $adjustedRate->description = $rate->send_another_rate['another_rate_description'] ?? '';
                $adjustedRate->zone = $rate->zone;
                $adjustedRate->merge_rate_tag = $rate->send_another_rate['another_merge_rate_tag'] ?? null;

                // Replace the current rate in the $filteredRates collection
                $filteredRates[] = $adjustedRate;
            }
        }

        if ($setting->mix_merge_rate == 1 && !empty($filteredRates)) {
            $collection = collect($filteredRates);

            // Group the rates by 'merge_rate_tag'
            $grouped = $collection->groupBy('merge_rate_tag');
            $newGrouped = [];
            $currency = null;
            $tagArr = [];

            // Loop through each group
            foreach ($grouped as $tag => $ratesGroup) {
                if (!empty($tag)) {
                    // Fetch MixMergeRate based on the tag
                    $mixMergeRate = MixMergeRate::whereRaw("FIND_IN_SET(?, tags_to_combine)", [$tag])
                        ->where('user_id', $userId)
                        ->where('status', 1)
                        ->first();

                    if ($mixMergeRate) {
                        $mixMergeRateId = $mixMergeRate->id;

                        // Initialize or merge rates under each MixMergeRate id
                        if (!isset($newGrouped[$mixMergeRateId])) {
                            $newGrouped[$mixMergeRateId] = [];
                        }
                        // Exclude certain tags
                        $tagsToExclude = explode(',', $mixMergeRate->tags_to_exclude);

                        if (!in_array($tag, $tagsToExclude)) {
                            $newGrouped[$mixMergeRateId] = array_merge($newGrouped[$mixMergeRateId], $ratesGroup->toArray());
                        }
                    }

                    $tagArr[] = $tag;
                }

                // Store currency (zone) if rates are not empty
                if ($ratesGroup->isNotEmpty() && is_null($currency)) {
                    $currency = $ratesGroup->first()['zone'];
                }
            }
            // Remove the grouped rates from $filteredRates
            $filteredRates = $filteredRates->reject(function ($rate) use ($tagArr) {
                // Log the current rate and tag for debugging
                Log::info("Checking rate for removal", ['merge_rate_tag' => $rate->merge_rate_tag, 'tagArr' => $tagArr]);

                // Reject (remove) if the merge_rate_tag is in the tagArr
                return in_array($rate->merge_rate_tag, $tagArr);
            });

            // Log::info($filteredRates);
            // Calculate and add new rates
            $newRates = [];
            foreach ($newGrouped as $mixMergeRateId => $groupRates) {
                $groupRatesCollection = collect($groupRates);
                $mixMergeRate = MixMergeRate::find($mixMergeRateId);

                if ($mixMergeRate) {
                    $allTagBasePrice = 0;

                    // Price calculation based on the type
                    switch ($mixMergeRate->price_calculation_type) {
                        case 0: // Sum
                            $allTagBasePrice = $groupRatesCollection->sum('base_price');
                            break;
                        case 1: // Average
                            $allTagBasePrice = round($groupRatesCollection->avg('base_price'), 2);
                            break;
                        case 2: // Minimum
                            $allTagBasePrice = $groupRatesCollection->min('base_price');
                            break;
                        case 3: // Maximum
                            $allTagBasePrice = $groupRatesCollection->max('base_price');
                            break;
                        case 4: // Product
                            $allTagBasePrice = $groupRatesCollection->reduce(function ($carry, $item) {
                                return $carry * $item['base_price'];
                            }, 1);
                            break;
                        default:
                            $allTagBasePrice = $groupRatesCollection->first()['base_price'];
                            break;
                    }

                    // Apply min/max shipping rate constraints
                    if ($mixMergeRate->min_shipping_rate > $allTagBasePrice && $mixMergeRate->min_shipping_rate != 0) {
                        $allTagBasePrice = $mixMergeRate->min_shipping_rate;
                    } elseif ($mixMergeRate->mix_shipping_rate < $allTagBasePrice && $mixMergeRate->mix_shipping_rate != 0) {
                        $allTagBasePrice = $mixMergeRate->mix_shipping_rate;
                    }

                    // Add to new rates
                    $newRates[] = (object)[
                        'name' => $mixMergeRate->rate_name,
                        'service_code' => $mixMergeRate->service_code,
                        'description' => $mixMergeRate->description,
                        'base_price' => $allTagBasePrice,
                        'zone' => $currency
                    ];
                }
            }

            // Merge the newly calculated rates with any remaining ungrouped rates
            $filteredRates = collect($filteredRates)->merge($newRates);
        }

        // if ($setting->mix_merge_rate == 1 && !empty($filteredRates)) {
        //     $collection = collect($filteredRates);

        //     // Group the rates by 'merge_rate_tag'
        //     $grouped = $collection->groupBy(function ($rate) {
        //         // Split by commas to ensure we handle multiple tags
        //         return explode(',', $rate->merge_rate_tag);
        //     });

        //     $newGrouped = [];
        //     $currency = null;
        //     $tagArr = [];

        //     // Loop through each group of tags
        //     foreach ($grouped as $tagSet => $ratesGroup) {
        //         // Ensure $tagSet is an array even if it's a single tag
        //         $tags = is_array($tagSet) ? $tagSet : explode(',', $tagSet);

        //         foreach ($tags as $tag) {
        //             if (!empty($tag)) {
        //                 // Fetch MixMergeRate based on the tag
        //                 $mixMergeRate = MixMergeRate::whereRaw("FIND_IN_SET(?, tags_to_combine)", [$tag])
        //                     ->where('user_id', $userId)
        //                     ->where('status', 1)
        //                     ->first();

        //                 if ($mixMergeRate) {
        //                     $mixMergeRateId = $mixMergeRate->id;

        //                     // Initialize or merge rates under each MixMergeRate id
        //                     if (!isset($newGrouped[$mixMergeRateId])) {
        //                         $newGrouped[$mixMergeRateId] = [];
        //                     }

        //                     // Exclude certain tags
        //                     $tagsToExclude = explode(',', $mixMergeRate->tags_to_exclude);

        //                     if (!in_array($tag, $tagsToExclude)) {
        //                         $newGrouped[$mixMergeRateId] = array_merge($newGrouped[$mixMergeRateId], $ratesGroup->toArray());
        //                     }
        //                 }

        //                 $tagArr[] = $tag;
        //             }
        //         }

        //         // Store currency (zone) if rates are not empty
        //         if ($ratesGroup->isNotEmpty() && is_null($currency)) {
        //             $currency = $ratesGroup->first()->zone; // Ensure to use -> for object access
        //         }
        //     }

        //     // Remove the grouped rates from $filteredRates
        //     $filteredRates = $filteredRates->reject(function ($rate) use ($tagArr) {
        //         $rateTags = explode(',', $rate->merge_rate_tag); // Split the merge_rate_tag

        //         // Log the current rate and tag for debugging
        //         Log::info("Checking rate for removal", ['merge_rate_tag' => $rateTags, 'tagArr' => $tagArr]);

        //         // Reject (remove) if any of the merge_rate_tags is in the tagArr
        //         return count(array_intersect($rateTags, $tagArr)) > 0; // Check for intersection
        //     });

        //     // Calculate and add new rates
        //     $newRates = [];
        //     foreach ($newGrouped as $mixMergeRateId => $groupRates) {
        //         $groupRatesCollection = collect($groupRates);
        //         $mixMergeRate = MixMergeRate::find($mixMergeRateId);

        //         if ($mixMergeRate) {
        //             $allTagBasePrice = 0;

        //             // Price calculation based on the type
        //             switch ($mixMergeRate->price_calculation_type) {
        //                 case 0: // Sum
        //                     $allTagBasePrice = $groupRatesCollection->sum('base_price');
        //                     break;
        //                 case 1: // Average
        //                     $allTagBasePrice = round($groupRatesCollection->avg('base_price'), 2);
        //                     break;
        //                 case 2: // Minimum
        //                     $allTagBasePrice = $groupRatesCollection->min('base_price');
        //                     break;
        //                 case 3: // Maximum
        //                     $allTagBasePrice = $groupRatesCollection->max('base_price');
        //                     break;
        //                 case 4: // Product
        //                     $allTagBasePrice = $groupRatesCollection->reduce(function ($carry, $item) {
        //                         return $carry * $item->base_price; // Ensure to use -> for object access
        //                     }, 1);
        //                     break;
        //                 default:
        //                     $allTagBasePrice = $groupRatesCollection->first()->base_price; // Ensure to use -> for object access
        //                     break;
        //             }

        //             // Apply min/max shipping rate constraints
        //             if ($mixMergeRate->min_shipping_rate > $allTagBasePrice && $mixMergeRate->min_shipping_rate != 0) {
        //                 $allTagBasePrice = $mixMergeRate->min_shipping_rate;
        //             } elseif ($mixMergeRate->mix_shipping_rate < $allTagBasePrice && $mixMergeRate->mix_shipping_rate != 0) {
        //                 $allTagBasePrice = $mixMergeRate->mix_shipping_rate;
        //             }

        //             // Add to new rates
        //             $newRates[] = (object)[
        //                 'name' => $mixMergeRate->rate_name,
        //                 'service_code' => $mixMergeRate->service_code,
        //                 'description' => $mixMergeRate->description,
        //                 'base_price' => $allTagBasePrice,
        //                 'zone' => $currency
        //             ];
        //         }
        //     }

        //     // Merge the newly calculated rates with any remaining ungrouped rates
        //     $filteredRates = collect($filteredRates)->merge($newRates);
        // }

        if ($setting->shippingRate == 'Only Higher') {
            $maxRate = $filteredRates->max('base_price');
            $filteredRates = $filteredRates->filter(function ($rate) use ($maxRate) {
                return $rate->base_price == $maxRate;
            });
        } elseif ($setting->shippingRate == 'Only Lower') {
            $minRate = $filteredRates->min('base_price');
            $filteredRates = $filteredRates->filter(function ($rate) use ($minRate) {
                return $rate->base_price == $minRate;
            });
        }

        // Log::info('Query logs:', ['queries' => DB::getQueryLog()]);
        // Log::info('Query logs:', ['totalQuantity' => $totalQuantity]);
        // Log::info('Shopify Carrier Service Request input:', ['filteredRates' => $filteredRates]);

        foreach ($filteredRates as $rate) {
            // dd($rate->name);
            // Log::info($rate);
            if (strpos($rate->description, "#") !== false) {
                $deliveryDay = str_replace('#', '', $rate->description);
                $descriptionNew = Carbon::now()->addDay($deliveryDay)->format('l, d M');
            } else {
                $descriptionNew = $rate->description;
            }

            $response['rates'][] = [
                'service_name' => $rate->name,
                'service_code' => $rate->service_code,
                'total_price' => $rate->base_price * 100, // Convert to cents if needed
                'description' => $descriptionNew,
                'currency' => $rate->zone->currency,
                // 'min_delivery_date' => Carbon::now()->addDay($deliveryDay)->toIso8601String(),
                // 'max_delivery_date' => Carbon::now()->addDay($deliveryDay)->toIso8601String(),
            ];

            // if (@$rate->send_another_rate['send_another_rate']) {
            //     $finalTotalPrice = 0;

            //     if ($rate->send_another_rate['update_price_type'] == 0) {
            //         if ($rate->send_another_rate['update_price_effect']) {
            //             $finalTotalPrice = $rate->base_price - $rate->send_another_rate['adjustment_price'];
            //         } else {
            //             $finalTotalPrice = $rate->base_price + $rate->send_another_rate['adjustment_price'];
            //         }
            //     } elseif ($rate->send_another_rate['update_price_type'] == 1) {
            //         if ($rate->send_another_rate['update_price_effect']) {
            //             $finalTotalPrice = $rate->base_price - ($rate->base_price * $rate->send_another_rate['adjustment_price'] / 100);
            //         } else {
            //             $finalTotalPrice = $rate->base_price + ($rate->base_price * $rate->send_another_rate['adjustment_price'] / 100);
            //         }
            //     } else {
            //         $finalTotalPrice = $rate->send_another_rate['adjustment_price'];
            //     }

            //     $response['rates'][] = [
            //         "service_name" => $rate->send_another_rate['another_rate_name'],
            //         "service_code" => $rate->send_another_rate['another_service_code'],
            //         "total_price" => $finalTotalPrice * 100,
            //         "description" => $rate->send_another_rate['another_rate_description'],
            //         "currency" => $rate->zone->currency,
            //         // 'min_delivery_date' => Carbon::now()->addDay()->toIso8601String(),
            //         // 'max_delivery_date' => Carbon::now()->addDay()->toIso8601String(),
            //     ];
            // }
        }

        // Log::info('Shopify Carrier Service input:', ["input" => $input]);
        Log::info('Shopify Carrier Service response:', ["response" => $response]);

        return response()->json($response);
    }

    // Function to calculate base price based on price_calculation_type
    // function calculateBasePrice($filteredRates, $mixRate, $priceCalculationType)
    // {
    //     switch ($priceCalculationType) {
    //         case 0:
    //             return $filteredRates->sum('base_price');
    //         case 1:
    //             return number_format($filteredRates->avg('base_price'), 2);
    //         case 2:
    //             return $filteredRates->min('base_price');
    //         case 3:
    //             return $filteredRates->max('base_price');
    //         case 4:
    //             return $filteredRates->reduce(function ($carry, $item) {
    //                 return $carry * $item['base_price'];
    //             }, 1);
    //         default:
    //             return $mixRate->base_price;
    //     }
    // }

    public function zoneStore(Request $request)
    {
        try {
            // Retrieve the shop from the request attributes (assuming middleware handles the shopify session)
            $shop = $request->attributes->get('shopifySession');
            // $shop = "krishnalaravel-test.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            $inputData = $request->all();

            $user_id = User::where('name', $shop)->value('id');

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $inputData['user_id'] = $user_id;

            // Validation rules and custom messages
            $rules = [
                'name' => 'required|string|max:255',
                'country' => 'required',
                'currency' => 'required|string|max:255'
            ];

            $messages = [
                'name.required' => 'The name is required.',
                'country.required' => 'The country is required.',
                'currency.required' => 'The currency field is required',
            ];

            // Validate the request input
            $validator = Validator::make($inputData, $rules, $messages);

            if ($validator->fails()) {
                return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
            }

            $countryData = $inputData['country'];

            unset($inputData['country']);

            // Update or create the zone
            $zone = Zone::updateOrCreate(['id' => $request->input('id')], $inputData);

            ZoneCountry::where('user_id', $user_id)->where('zone_id', $zone->id)->delete();

            foreach ($countryData as $country) {
                // Check if either the country name or country code is empty
                if (empty($country['name']) || empty($country['code'])) {
                    continue; // Skip this iteration and move to the next country
                }

                $insertData = [
                    'user_id' => $user_id,
                    'zone_id' => $zone->id,
                    'countryCode' => $country['code'],
                    'country' => $country['name']
                ];

                ZoneCountry::create($insertData);
            }

            return response()->json(['status' => true, 'message' => 'Zone added successfully.', 'id' => $zone->id]);
        } catch (\Throwable $th) {
            Log::error('Unexpected zone add error', ['exception' => $th->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function zoneEdit(Request $request)
    {
        try {
            // Assuming this is how you get the shop
            $shop = request()->attributes->get('shopifySession');
            // $shop = "krishnalaravel-test.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            // Validate if shop exists in the User table
            $user = User::where('name', $shop)->first();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $zoneId = $request->input('zone_id');
            // Validate if the zone exists
            $zone = Zone::with('countries:zone_id,countryCode,country')->find($zoneId);

            if (!$zone) {
                return response()->json([
                    'status' => false,
                    'message' => 'Zone not found.'
                ], 404);
            }

            $zone->country = $zone->countries->pluck('countryCode')->all();
            unset($zone->countries);

            // Initialize the query for fetching rates
            $ratesQuery = Rate::where('user_id', $user->id)->where('zone_id', $zoneId);

            // If a name parameter is provided, filter the results based on it
            $filter_param = $request->input('filter_param');

            if (@$filter_param) {
                $ratesQuery->where(function ($query) use ($filter_param) {
                    $query->where('name', 'like', '%' . $filter_param . '%')
                        ->orWhere('service_code', 'like', '%' . $filter_param . '%');
                });
            }

            // Fetch the rates, with optional pagination
            $per_page = $request->input('per_page', 10);
            $rates = $ratesQuery->paginate($per_page);
            // dd($rates->items());

            return response()->json([
                'status' => true,
                'message' => 'Zone data with rate retrieved successfully.',
                'zone' => $zone,
                'ratePagination' => [
                    'total' => $rates->total(),
                    'per_page' => $rates->perPage(),
                    'current_page' => $rates->currentPage(),
                    'last_page' => $rates->lastPage(),
                    'next_page_url' => $rates->nextPageUrl(),
                    'prev_page_url' => $rates->previousPageUrl(),
                ],
                'rates' => $rates->items()
            ]);
        } catch (\Illuminate\Database\QueryException $ex) {
            Log::error('Database error when retrieving rate list', ['exception' => $ex->getMessage()]);
            return response()->json(['status' => false, 'message' => 'Database error occurred.'], 500);
        } catch (Throwable $th) {
            Log::error('Unexpected zone edit error', ['exception' => $th->getMessage()]);

            return response()->json([
                'status' => false,
                'message' => 'An unexpected error occurred.'
            ], 500);
        }
    }

    public function zoneList(Request $request, $name = null)
    {
        try {
            $shop = request()->attributes->get('shopifySession');
            // $shop = "krishnalaravel-test.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            $user_id = User::where('name', $shop)->pluck('id')->first();

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $per_page = $request->input('per_page', 10);

            $zonesQuery = Zone::with('countries:zone_id,country')->where('user_id', $user_id);

            if ($name) {
                $zonesQuery->where('name', 'like', '%' . $name . '%');
            }

            $zones = $zonesQuery->paginate($per_page);

            // foreach ($zones as $zone) {
            //     $zone->country = $zone->countries->pluck('country')->implode(', ');
            //     unset($zone->countries);
            // }

            return response()->json([
                'status' => true,
                'message' => 'Zone list retrieved successfully.',
                'pagination' => [
                    'total' => $zones->total(),
                    'per_page' => $zones->perPage(),
                    'current_page' => $zones->currentPage(),
                    'last_page' => $zones->lastPage(),
                    'next_page_url' => $zones->nextPageUrl(),
                    'prev_page_url' => $zones->previousPageUrl(),
                ],
                'zones' => $zones->items()
            ]);
        } catch (Throwable $th) {
            Log::error('Unexpected zone list error', ['exception' => $th->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function zoneDestroy($id)
    {
        try {
            $shop = request()->attributes->get('shopifySession');
            // $shop = "krishnalaravel-test.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            $user_id = User::where('name', $shop)->pluck('id')->first();

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $zone = Zone::where('user_id', $user_id)->findOrFail($id);

            $zone->delete();

            return response()->json([
                'status' => true,
                'message' => 'Zone deleted successfully.'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['status' => false, 'message' => 'Zone not found.']);
        } catch (Throwable $th) {
            Log::error('Unexpected zone delete error', ['exception' => $th->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred.'], 500);
        }
    }

    private function getState($countrys)
    {
        $states = [];

        foreach ($countrys as $code => $country) {
            $stateList = CountryState::getStates($code);
            $planCountry = preg_replace('/\s*\([^)]+\)/', '', $country);

            foreach ($stateList as $isoCode => $name) {
                $states[$planCountry][] = [
                    'code' => $isoCode,
                    'name' => $name,
                    'nameCode' => "$name ($isoCode)"
                ];
            }
        }

        return $states;
    }

    public function rateCreate($zoneId)
    {
        try {
            $shop = request()->attributes->get('shopifySession');
            // $shop = "krishnalaravel-test.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            // Validate if shop exists in the User table
            $user = User::where('name', $shop)->first();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $zone = Zone::with('countries:zone_id,countryCode,country')->find($zoneId);

            if (!$zone) {
                return response()->json([
                    'status' => false,
                    'message' => 'Zone not found.'
                ], 404);
            }

            $states = $this->getState($zone->countries->pluck('country', 'countryCode'));

            $rate = [
                "shop_weight_unit" => $user->shop_weight_unit
            ];

            if (!empty($user->shop_currency)) {
                $symbol = CurrencySymbolUtil::getSymbol($user->shop_currency);
                $rate['shop_currency'] = $symbol;
            }

            return response()->json([
                'status' => true,
                'message' => 'Rate create data retrieved successfully.',
                'states' => $states,
                'rate' => $rate,
            ]);
        } catch (\Illuminate\Database\QueryException $ex) {
            Log::error('Database error when retrieving rate list', ['exception' => $ex->getMessage()]);
            return response()->json(['status' => false, 'message' => 'Database error occurred.'], 500);
        } catch (Throwable $th) {
            Log::error('Unexpected zone edit error', ['exception' => $th->getMessage()]);

            return response()->json([
                'status' => false,
                'message' => 'An unexpected error occurred.'
            ], 500);
        }
    }

    public function rateStore(Request $request)
    {
        try {
            $shop = $request->attributes->get('shopifySession');
            // $shop = "krishnalaravel-test.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            $inputData = $request->all();
            // dd($inputData);
            $user_id = User::where('name', $shop)->value('id');

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $inputData['user_id'] = $user_id;

            $rules = [
                'zone_id' => 'required|exists:zones,id',
                'service_code' => [
                    'required',
                    Rule::unique('rates', 'service_code')->ignore($request->input('id')),
                ],
            ];

            $messages = [
                'zone_id.required' => 'The zone ID is required.',
                'zone_id.exists' => 'The selected zone ID is invalid.',
                'service_code.required' => 'The service code is required.',
                'service_code.unique' => 'The service code should not be the same as any other rate.',
            ];

            if (isset($inputData['zipcode'])) {
                $rules = array_merge($rules, [
                    'zipcode.stateSelection' => 'required',
                    'zipcode.state' => 'required_if:zipcode.stateSelection,Custom|array',
                    'zipcode.zipcodeSelection' => 'required',
                    'zipcode.zipcode' => 'required_if:zipcode.zipcodeSelection,Custom|array',
                    'zipcode.isInclude' => 'required_if:zipcode.zipcodeSelection,Custom',
                ]);

                $messages = array_merge($messages, [
                    'zipcode.stateSelection.required' => 'The state selection is required.',
                    'zipcode.state.required_if' => 'The state field is required when the stateSelection is Custom.',
                    'zipcode.zipcodeSelection.required' => 'The zipcode selection is required.',
                    'zipcode.zipcode.required_if' => 'The zipcode field is required when the zipcodeSelection is Custom.',
                    'zipcode.isInclude.required_if' => 'The inclusion field is required when the zipcodeSelection is Custom.',
                ]);
            }

            if (isset($inputData['cart_condition'])) {
                $rules = array_merge($rules, [
                    'cart_condition.conditionMatch' => 'in:0,1,2,3',
                    'cart_condition.cartCondition' => 'array',
                ]);

                // Check if cartCondition exists and is an array
                if (!empty($inputData['cart_condition']['cartCondition']) && is_array($inputData['cart_condition']['cartCondition'])) {
                    // Validate each object in the cartCondition array
                    foreach ($inputData['cart_condition']['cartCondition'] as $key => $item) {
                        $rules["cart_condition.cartCondition.{$key}.label"] = 'required';
                    }
                }

                $messages = array_merge($messages, [
                    'cart_condition.conditionMatch.in' => 'The condition must be one of the following: 0=Not Any Condition, 1=All, 2=Any, 3=NOT All',
                    'cart_condition.cartCondition.array' => 'The cart condition must be an array.',
                    'cart_condition.cartCondition.label.required' => 'The cart condition label is required when cart conditions are specified.',
                ]);

                $inputData['conditionMatch'] = $inputData['cart_condition']['conditionMatch'];
            }


            if (isset($inputData['scheduleRate'])) {
                $rules = array_merge($rules, [
                    'scheduleRate.schedule_start_date_time' => 'required_if:scheduleRate.schedule_rate,1|date',
                    'scheduleRate.schedule_end_date_time' => 'required_if:scheduleRate.schedule_rate,1|date',
                ]);

                $messages = array_merge($messages, [
                    'scheduleRate.schedule_start_date_time.required_if' => 'The schedule start date and time is required when schedule rate is set to Yes.',
                    'scheduleRate.schedule_start_date_time.date' => 'The schedule start date and time must be a valid date and time.',
                    'scheduleRate.schedule_end_date_time.required_if' => 'The schedule end date and time is required when schedule rate is set to Yes.',
                    'scheduleRate.schedule_end_date_time.date' => 'The schedule end date and time must be a valid date and time.',
                ]);

                $inputData['schedule_rate'] = $inputData['scheduleRate']['schedule_rate'];

                if ($inputData['scheduleRate']['schedule_rate']) {
                    $inputData['schedule_start_date_time'] = $inputData['scheduleRate']['schedule_start_date_time'];
                    $inputData['schedule_end_date_time'] = $inputData['scheduleRate']['schedule_end_date_time'];
                } else {
                    $inputData['schedule_start_date_time'] = null;
                    $inputData['schedule_end_date_time'] = null;
                }

                unset($inputData['scheduleRate']);
            }

            // Validate the request input
            $validator = Validator::make($inputData, $rules, $messages);

            if ($validator->fails()) {
                return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
            }

            $inputData['rate_based_on_surcharge'] = $inputData['rate_based_on_surcharge'] ?? null;
            $inputData['rate_tier'] = $inputData['rate_tier'] ?? null;
            $inputData['exclude_rate_for_products'] = $inputData['exclude_rate_for_products'] ?? null;
            $inputData['rate_modifiers'] = $inputData['rate_modifiers'] ?? null;
            $inputData['send_another_rate'] = $inputData['send_another_rate'] ?? null;

            // Update or create the rate
            $rate = Rate::updateOrCreate(['id' => $request->input('id')], $inputData);

            if (isset($inputData['zipcode'])) {
                $zipcodeData = [
                    "user_id" => $user_id,
                    "rate_id" => $rate->id,
                    "stateSelection" => $inputData['zipcode']['stateSelection'],
                    "zipcodeSelection" => $inputData['zipcode']['zipcodeSelection']
                ];

                if ($inputData['zipcode']['stateSelection'] == 'Custom' && isset($inputData['zipcode']['state'])) {
                    $zipcodeData['state'] = json_encode($inputData['zipcode']['state']);
                } else {
                    $zipcodeData['state'] = null;
                }

                if ($inputData['zipcode']['zipcodeSelection'] == 'Custom') {
                    if (isset($inputData['zipcode']['zipcode'])) {
                        $zipcodeData['zipcode'] = implode(",", $inputData['zipcode']['zipcode']);
                    }

                    if (isset($inputData['zipcode']['isInclude'])) {
                        $zipcodeData['isInclude'] = $inputData['zipcode']['isInclude'];
                    }
                } else {
                    $zipcodeData['zipcode'] = null;
                    $zipcodeData['isInclude'] = null;
                }

                RateZipcode::updateOrCreate(['rate_id' => $rate->id], $zipcodeData);
            }

            if ($rate->wasRecentlyCreated) {
                $message = 'Rate added successfully.';
            } else {
                $message = 'Rate updated successfully.';
            }

            return response()->json(['status' => true, 'message' => $message, 'id' => $rate->id]);
        } catch (\Illuminate\Database\QueryException $ex) {
            Log::error('Database error when adding rate', ['exception' => $ex->getMessage()]);
            return response()->json(['status' => false, 'message' => 'Database error occurred.'], 500);
        } catch (\Exception $ex) {
            Log::error('Unexpected error when adding rate', ['exception' => $ex->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function rateList($zone_id, $name = null)
    {
        try {
            $shop = request()->attributes->get('shopifySession');
            // $shop = "krishnalaravel-test.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            $user_id = User::where('name', $shop)->value('id');

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            // Validate the zone_id parameter
            if (!Zone::where('id', $zone_id)->exists()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Zone not found.'
                ], 404);
            }

            // Initialize the query for fetching rates
            $ratesQuery = Rate::where('user_id', $user_id)->where('zone_id', $zone_id);

            // If a name parameter is provided, filter the results based on it
            if ($name) {
                $ratesQuery->where(function ($query) use ($name) {
                    $query->where('name', 'like', '%' . $name . '%')
                        ->orWhere('service_code', 'like', '%' . $name . '%');
                });
            }

            // Fetch the rates, with optional pagination
            $per_page = request()->input('per_page', 10);
            $rates = $ratesQuery->paginate($per_page);

            return response()->json([
                'status' => true,
                'message' => 'Rate list retrieved successfully.',
                'pagination' => [
                    'total' => $rates->total(),
                    'per_page' => $rates->perPage(),
                    'current_page' => $rates->currentPage(),
                    'last_page' => $rates->lastPage(),
                    'next_page_url' => $rates->nextPageUrl(),
                    'prev_page_url' => $rates->previousPageUrl(),
                ],
                'rates' => $rates->items(),
            ]);
        } catch (\Illuminate\Database\QueryException $ex) {
            Log::error('Database error when retrieving rate list', ['exception' => $ex->getMessage()]);
            return response()->json(['status' => false, 'message' => 'Database error occurred.'], 500);
        } catch (\Exception $ex) {
            Log::error('Unexpected error when retrieving rate list', ['exception' => $ex->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function rateEdit($id)
    {
        try {
            $shop = request()->attributes->get('shopifySession');
            // $shop = "krishnalaravel-test.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            // Validate if shop exists in the User table
            $user = User::where('name', $shop)->first();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            // Validate if the zone exists
            $rate = Rate::with('zone.countries')->with('zipcode')->find($id);

            if (!$rate) {
                return response()->json([
                    'status' => false,
                    'message' => 'Rate not found.'
                ], 404);
            }

            $rate->shop_weight_unit = $user->shop_weight_unit;
            if (!empty($user->shop_currency)) {
                $symbol = CurrencySymbolUtil::getSymbol($user->shop_currency);
                $rate->shop_currency = $symbol;
            }

            $countryList = $rate->zone->countries->pluck('country', 'countryCode');

            $state = $this->getState($countryList);

            if ($rate->schedule_rate) {
                $rate->scheduleRate = [
                    "schedule_rate" => $rate->schedule_rate,
                    "schedule_start_date_time" => $rate->schedule_start_date_time,
                    "schedule_end_date_time" => $rate->schedule_end_date_time
                ];

                unset($rate->schedule_rate);
                unset($rate->schedule_start_date_time);
                unset($rate->schedule_end_date_time);
            }

            unset($rate->zone);

            return response()->json([
                'status' => true,
                'message' => 'Rate data retrieved successfully.',
                'rate' => $rate,
                'states' => $state
            ]);
        } catch (Throwable $th) {
            Log::error('Unexpected zone edit error', ['exception' => $th->getMessage()]);

            return response()->json([
                'status' => false,
                'message' => 'An unexpected error occurred.'
            ], 500);
        }
    }

    public function rateDestroy($id)
    {
        try {
            $shop = request()->attributes->get('shopifySession');
            // $shop = "krishnalaravel-test.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            $user_id = User::where('name', $shop)->pluck('id')->first();

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $rate = Rate::where('user_id', $user_id)->findOrFail($id);

            $rate->delete();

            return response()->json([
                'status' => true,
                'message' => 'Rate deleted successfully.'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['status' => false, 'message' => 'Rate not found.']);
        } catch (Throwable $th) {
            Log::error('Unexpected rate delete error', ['exception' => $th->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function getShopLocation()
    {
        try {

            // Retrieve the Shopify session
            $shop = request()->attributes->get('shopifySession');
            // $shop = "krishnalaravel-test.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            // Fetch the token for the shop
            $token = User::where('name', $shop)->first();

            if (!$token) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            // Define the REST API endpoint
            $restEndpoint = "https://{$shop}/admin/api/2024-04/locations.json";

            // Headers for Shopify API request
            $customHeaders = [
                'X-Shopify-Access-Token' => $token['password'],
            ];

            // Make HTTP GET request to Shopify REST API endpoint
            $response = Http::withHeaders($customHeaders)->get($restEndpoint);
            // Check if the request was successful
            if ($response->successful()) {
                $responseData = [
                    "status" => true,
                    "message" => "Shop location retrieved successfully.",
                    'locations' => $response->json('locations')
                ];

                return response()->json($responseData);
            } else {
                // Handle non-successful responses
                return response()->json(['status' => false, 'error' => 'Unable to fetch shop location list']);
            }
        } catch (RequestException $e) {
            Log::error('HTTP request error', ['exception' => $e->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred:']);
        } catch (Throwable $th) {
            Log::error('Unexpected error', ['exception' => $th->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred:']);
        }
    }

    public function getProductList(Request $request)
    {
        try {
            // $shop = $request->attributes->get('shopifySession');
            $shop = "kaushik-panot.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            $post = $request->input();

            // Retrieve the Shopify access token based on the store name
            $token = User::where('name', $shop)->first();

            if (!$token) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            // Determine the query string based on cursor parameters
            if (isset($post['endCursor'])) {
                $querystring = 'first: 10, after: "' . $post['endCursor'] . '"';
            } elseif (isset($post['startCursor'])) {
                $querystring = 'last: 10, before: "' . $post['startCursor'] . '"';
            } else {
                $querystring = 'first: 10';
            }

            // Determine the query parameter
            if (isset($post['query']) && is_numeric($post['query'])) {
                $collectionId = $post['query'];
                $query = <<<GRAPHQL
                    {
                        collection(id: "gid://shopify/Collection/$collectionId") {
                            products($querystring) {
                                edges {
                                    node {
                                        id
                                        title
                                        variants(first: 1) {
                                            edges {
                                                node {
                                                    id
                                                    price
                                                }
                                            }
                                        }
                                        images(first: 1) {
                                            edges {
                                                node {
                                                    originalSrc
                                                    altText
                                                }
                                            }
                                        }
                                    }
                                }
                                pageInfo {
                                    hasNextPage
                                    hasPreviousPage
                                    endCursor
                                    startCursor
                                }
                            }
                        }
                    }
                    GRAPHQL;
            } else {
                $queryParam = isset($post['query']) ? 'query:"' . $post['query'] . '"' : '';
                $query = <<<GRAPHQL
                {
                    products($querystring, sortKey: CREATED_AT, reverse: true, $queryParam) {
                        edges {
                            node {
                                id
                                title
                                variants(first: 1) {
                                    edges {
                                        node {
                                            id
                                            price
                                        }
                                    }
                                }
                                images(first: 1) {
                                    edges {
                                        node {
                                            originalSrc
                                            altText
                                        }
                                    }
                                }
                            }
                        }
                        pageInfo {
                            hasNextPage
                            hasPreviousPage
                            endCursor
                            startCursor
                        }
                    }
                }
                GRAPHQL;
            }

            // Shopify GraphQL endpoint
            $graphqlEndpoint = "https://$shop/admin/api/2023-07/graphql.json";

            // Headers for Shopify API request
            $customHeaders = [
                'X-Shopify-Access-Token' => $token['password'],
            ];

            // Make HTTP POST request to Shopify GraphQL endpoint
            $response = Http::withHeaders($customHeaders)->post($graphqlEndpoint, [
                'query' => $query,
            ]);

            // Parse the JSON response
            $jsonResponse = $response->json();
            // Prepare the response data
            $data['products'] = [];
            if (isset($jsonResponse['data'])) {
                $collectionsArray = [];
                $jsonResponseData = isset($jsonResponse['data']['collection']) ? $jsonResponse['data']['collection']['products'] : $jsonResponse['data']['products'];
                foreach ($jsonResponseData['edges'] as $value) {
                    $product = $value['node'];
                    // dump($product);
                    // Fetch the first variant's price
                    $price = null;
                    if (isset($product['variants']['edges'][0]['node']['price'])) {
                        $price = $product['variants']['edges'][0]['node']['price'];
                    }

                    $itemArray = [
                        'id' => str_replace('gid://shopify/Product/', '', $product['id']),
                        'title' => ucfirst($product['title']),
                        'image' => isset($product['images']['edges'][0]['node']['originalSrc']) ? $product['images']['edges'][0]['node']['originalSrc'] : null,
                        'price' => $price
                    ];
                    $collectionsArray[] = $itemArray;
                }

                $data['products'] = $collectionsArray;
                $data['hasNextPage'] = $jsonResponseData['pageInfo']['hasNextPage'];
                $data['hasPreviousPage'] = $jsonResponseData['pageInfo']['hasPreviousPage'];
                $data['endCursor'] = $jsonResponseData['pageInfo']['endCursor'];
                $data['startCursor'] = $jsonResponseData['pageInfo']['startCursor'];
            }
            // Return the JSON response
            return response()->json($data);
        } catch (Throwable $th) {
            Log::error('Unexpected error during banner front data fetch', [
                'exception' => $th->getMessage(),
                'file' => $th->getFile(),
                'line' => $th->getLine()
            ]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred.'], 500);
        }
    }
}