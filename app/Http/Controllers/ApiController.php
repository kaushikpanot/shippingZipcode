<?php

namespace App\Http\Controllers;

use App\Models\Rate;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Http\Request;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

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

            // Define the REST API endpoint
            $restEndpoint = "https://{$shop}/admin/api/2024-04/countries.json";

            // Headers for Shopify API request
            $customHeaders = [
                'X-Shopify-Access-Token' => $token,
            ];

            // Make HTTP GET request to Shopify REST API endpoint
            $response = Http::withHeaders($customHeaders)->get($restEndpoint);

            // Check if the request was successful
            if ($response->successful()) {
                // Decode the JSON response
                $countriesList = $response->json('countries');

                $collection = collect($countriesList);

                $countries = $collection->map(function ($country) {
                    unset($country['tax_name'], $country['tax'], $country['provinces']);
                    return $country;
                });

                $responseData = [
                    'countries' => $countries->all()
                ];

                return response()->json($responseData);
            } else {
                // Handle non-successful responses
                return response()->json(['status' => false, 'error' => 'Unable to fetch country list']);
            }
        } catch (RequestException $e) {
            // Handle request-specific exceptions
            Log::error('HTTP request error', ['exception' => $e->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred:']);
        } catch (Throwable $th) {
            Log::error('Unexpected error', ['exception' => $th->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred:']);
        }
    }

    public function getCurrencyList()
    {
        try {
            // Retrieve the Shopify session
            $shop = request()->attributes->get('shopifySession');

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

            // Define the REST API endpoint
            $restEndpoint = "https://{$shop}/admin/api/2024-04/currencies.json";

            // Headers for Shopify API request
            $customHeaders = [
                'X-Shopify-Access-Token' => $token,
            ];

            // Make HTTP GET request to Shopify REST API endpoint
            $response = Http::withHeaders($customHeaders)->get($restEndpoint);
            // Check if the request was successful
            if ($response->successful()) {
                $responseData = [
                    'currencies' => $response->json('currencies')
                ];

                return response()->json($responseData);
            } else {
                // Handle non-successful responses
                return response()->json(['status' => false, 'error' => 'Unable to fetch Currency list']);
            }
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

        // Construct the response data
        $response = [
            'rates' => [
                [
                    'service_name' => 'Standard Shipping555',
                    'service_code' => 'STANDARD',
                    'total_price' => 5000, // Price in cents
                    'description' => 'Delivered within 5-7 business days',
                    'currency' => 'USD',
                ],

            ]
        ];

        // Log the input data for debugging
        Log::info('Shopify Carrier Service Request:', $input);

        // Return the JSON response
        return response()->json($response);
    }

    public function zoneStore(Request $request)
    {
        try {
            // Retrieve the shop from the request attributes (assuming middleware handles the shopify session)
            $shop = $request->attributes->get('shopifySession');

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
                'country' => 'required|string|max:255',
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

            // Update or create the zone
            Zone::updateOrCreate(['id' => $request->input('id')], $inputData);

            return response()->json(['status' => true, 'message' => 'Zone added successfully.']);
        } catch (\Throwable $th) {
            Log::error('Unexpected zone add error', ['exception' => $th->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function zoneEdit($id)
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
            $zone = Zone::find($id);

            if (!$zone) {
                return response()->json([
                    'status' => false,
                    'message' => 'Zone not found.'
                ], 404);
            }

            return response()->json([
                'status' => true,
                'message' => 'Zone data retrieved successfully.',
                'zone' => $zone
            ]);
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

            $zonesQuery = Zone::where('user_id', $user_id);

            if ($name) {
                $zonesQuery->where('name', 'like', '%' . $name . '%');
            }

            $zones = $zonesQuery->paginate($per_page);

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
                'zone_id' => 'required|exists:zones,id',
                // Add other validation rules here if necessary
            ];

            $messages = [
                'zone_id.required' => 'The zone ID is required.',
                'zone_id.exists' => 'The selected zone ID is invalid.',
            ];

            // Validate the request input
            $validator = Validator::make($inputData, $rules, $messages);

            if ($validator->fails()) {
                return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
            }

            // Update or create the rate
            Rate::updateOrCreate(['id' => $request->input('id')], $inputData);

            return response()->json(['status' => true, 'message' => 'Rate added successfully.']);
        } catch (\Illuminate\Database\QueryException $ex) {
            Log::error('Database error when adding rate', ['exception' => $ex->getMessage()]);
            return response()->json(['status' => false, 'message' => 'Database error occurred.'], 500);
        } catch (\Exception $ex) {
            Log::error('Unexpected error when adding rate', ['exception' => $ex->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred.'], 500);
        }
    }
}
