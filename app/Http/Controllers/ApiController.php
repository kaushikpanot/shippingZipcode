<?php

namespace App\Http\Controllers;

use App\Models\Rate;
use App\Models\RateZipcode;
use App\Models\Setting;
use App\Models\User;
use App\Models\Zone;
use App\Models\ZoneCountry;
use Illuminate\Http\Request;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;
use CountryState;

class ApiController extends Controller
{
    public function getCountryList(Request $request)
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
            $token = User::where('name', $shop)->pluck('password')->first();

            if (!$token) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            // // Define the REST API endpoint
            // $restEndpoint = "https://{$shop}/admin/api/2024-04/countries.json";

            // // Headers for Shopify API request
            // $customHeaders = [
            //     'X-Shopify-Access-Token' => $token,
            // ];

            // Make HTTP GET request to Shopify REST API endpoint
            // $response = Http::withHeaders($customHeaders)->get($restEndpoint);

            // Check if the request was successful
            // if ($response->successful()) {
            //     // Decode the JSON response
            //     $countriesList = $response->json('countries');

            //     $collection = collect($countriesList);

            //     $countries = $collection->map(function ($country) {
            //         unset($country['tax_name'], $country['tax'], $country['provinces']);
            //         return $country;
            //     });

            //     $responseData = [
            //         'countries' => $countries->all()
            //     ];

            //     return response()->json($responseData);
            // } else {
            //     // Handle non-successful responses
            //     return response()->json(['status' => false, 'error' => 'Unable to fetch country list']);
            // }

            // Fetch JSON data from the external API
            // $jsonData = file_get_contents('http://country.io/names.json');

            // Decode JSON data into a PHP associative array
            // $countriesArray = json_decode($jsonData, true);
            $countriesArray = CountryState::getCountries();

            // Initialize an empty array to hold the formatted data
            $countries = [];

            // Iterate over the associative array and format it into an array of objects
            foreach ($countriesArray as $isoCode => $name) {
                $countries[] = (object) [
                    'code' => $isoCode,
                    'name' => $name,
                    'nameCode' => $name . " " . "(" . $isoCode . ")"
                ];
            }

            return response()->json(['status' => true, 'message' => 'countries list retrieved successfully.', 'countries' => $countries]);
        } catch (RequestException $e) {
            // Handle request-specific exceptions
            Log::error('HTTP request error', ['exception' => $e->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred:']);
        } catch (Throwable $th) {
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
            // $shop = request()->attributes->get('shopifySession');
            $shop = "krishnalaravel-test.myshopify.com";

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

    public function getResponse(Request $request)
    {
        $input = $request->input();

        $shopDomain = $request->header();
        // Construct the response data
        $originCompanyName = $shopDomain['x-shopify-shop-domain'][0];

        $originCountryName = $input['rate']['origin']['country'];

        $destinationZipcode = $input['rate']['destination']['postal_code'];
        $destinationProvince = $input['rate']['destination']['province'];

        $userId = User::where('name', $originCompanyName)->value('id');

        $setting = Setting::where('user_id', $userId)->first();

        $response = [];

        if (!empty($setting) && !$setting->status) {
            return response()->json($response);
        }

        $zoneIds = ZoneCountry::where('user_id', $userId)->where('countryCode', $originCountryName)->whereHas('zone', function ($query) {
            $query->where('status', 1);
        })->pluck('zone_id');

        // Log::info($zoneIds);
        // DB::enableQueryLog();
        $ratesQuery = Rate::whereIn('zone_id', $zoneIds)->where('user_id', $userId)->where('status', 1)->with('zone:id,currency', 'zipcode');

        // Determine the appropriate rate based on the shipping rate setting
        if ($setting->shippingRate == 'Only Higher') {
            $maxRate = $ratesQuery->max('base_price');
            $ratesQuery->where('base_price', $maxRate);
        } elseif ($setting->shippingRate == 'Only Lower') {
            $minRate = $ratesQuery->min('base_price');
            $ratesQuery->where('base_price', $minRate);
        }

        $rates = $ratesQuery->get();

        $filteredRates = $rates->map(function ($rate) use ($destinationProvince, $destinationZipcode) {
            $zipcode = optional($rate->zipcode);

            // Check state selection
            if ($zipcode->stateSelection === 'Custom') {
                $stateArr = $zipcode->state;
                $stateCollection = collect($stateArr);
                $states = $stateCollection->map(function ($state) {
                    return $state->code;
                })->all();
                // $states = $zipcode->state;
                if (!in_array($destinationProvince, $states)) {
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

            return $rate;
        })->filter();

        // Log::info('Query logs:', ['queries' => DB::getQueryLog()]);
        // Log::info('Query logs:', ['states' => $states]);
        Log::info('Shopify Carrier Service Request input:', ['rates1' => $filteredRates]);

        foreach ($filteredRates as $rate) {
            $response['rates'][] = [
                'service_name' => $rate->name,
                'service_code' => $rate->service_code,
                'total_price' => $rate->base_price, // Convert to cents if needed
                'description' => $rate->description,
                'currency' => $rate->zone->currency,
            ];
        }

        Log::info('Shopify Carrier Service response:', ["response" => $response]);

        return response()->json($response);
    }

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

            return response()->json(['status' => true, 'message' => 'Zone added successfully.']);
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

            if(@$filter_param) {
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

            return response()->json([
                'status' => true,
                'message' => 'Rate create data retrieved successfully.',
                'states' => $states
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
            // $shop = $request->attributes->get('shopifySession');
            $shop = "krishnalaravel-test.myshopify.com";

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
            ];

            $messages = [
                'zone_id.required' => 'The zone ID is required.',
                'zone_id.exists' => 'The selected zone ID is invalid.',
            ];

            if (isset($inputData['zipcode'])) {
                $rules = array_merge($rules, [
                    'zipcode.stateSelection' => 'required',
                    'zipcode.state' => 'required_if:zipcode.stateSelection,Custom|array',
                    'zipcode.zipcodeSelection' => 'required',
                    'zipcode.zipcode' => 'required_if:zipcode.zipcodeSelection,Custom|array',
                    'zipcode.isInclude' => 'required_if:zipcode.zipcodeSelection,Custom|string',
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
                    'cart_condition.conditionMatch' => 'required|in:0,1,2,3',
                    'cart_condition.cartCondition' => 'required|array',
                ]);

                $messages = array_merge($messages, [
                    'cart_condition.conditionMatch.required' => 'The condition match field is required.',
                    'cart_condition.conditionMatch.in' => 'The condition must be one of the following: 0=Not Any Condition, 1=All, 2=Any, 3=NOT All',
                    'cart_condition.cartCondition.required' => 'The cart condition field is required.',
                    'cart_condition.cartCondition.array' => 'The cart condition must be an array.',
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
                $inputData['schedule_start_date_time'] = $inputData['scheduleRate']['schedule_start_date_time'];
                $inputData['schedule_end_date_time'] = $inputData['scheduleRate']['schedule_end_date_time'];
                unset($inputData['scheduleRate']);
            }

            // Validate the request input
            $validator = Validator::make($inputData, $rules, $messages);

            if ($validator->fails()) {
                return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
            }

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

            return response()->json(['status' => true, 'message' => $message]);
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

            // Validate if the zone exists
            $rate = Rate::with('zone.countries')->with('zipcode')->find($id);

            if (!$rate) {
                return response()->json([
                    'status' => false,
                    'message' => 'Rate not found.'
                ], 404);
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
            $shop = "krishnalaravel-test.myshopify.com";

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
            $queryParam = isset($post['query']) ? 'query:"' . $post['query'] . '"' : '';

            // GraphQL query to fetch products
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
            $data = [];
            if (isset($jsonResponse['data'])) {
                $collectionsArray = [];
                foreach ($jsonResponse['data']['products']['edges'] as $value) {
                    $product = $value['node'];
                    // Fetch the first variant's price
                    $price = null;
                    if (isset($product['variants']['edges'][0]['node']['price'])) {
                        $price = $product['variants']['edges'][0]['node']['price'];
                    }
                    $itemArray = [
                        'id' => str_replace('gid://shopify/Product/', '', $product['id']),
                        'title' => ucfirst($product['title']),
                        'image' => isset($product['images']['edges'][0]['node']['originalSrc']) ? $product['images']['edges'][0]['node']['originalSrc'] : null,
                        'price'=>$price
                    ];
                    $collectionsArray[] = $itemArray;
                }

                $data['products'] = $collectionsArray;
                $data['hasNextPage'] = $jsonResponse['data']['products']['pageInfo']['hasNextPage'];
                $data['hasPreviousPage'] = $jsonResponse['data']['products']['pageInfo']['hasPreviousPage'];
                $data['endCursor'] = $jsonResponse['data']['products']['pageInfo']['endCursor'];
                $data['startCursor'] = $jsonResponse['data']['products']['pageInfo']['startCursor'];
            }

            // Return the JSON response
            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Unexpected get product api error', ['exception' => $e->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred:']);
        }
    }
}
