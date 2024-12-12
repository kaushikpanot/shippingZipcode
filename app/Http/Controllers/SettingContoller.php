<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Throwable;

class SettingContoller extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
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

            $user_id = User::where('name', $shop)->first();

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $settings = Setting::where('user_id', $user_id['id'])->first();

            if ($settings) {
                $settings->is_on_board = $user_id['is_on_board'];
            }

            return response()->json([
                'status' => true,
                'message' => 'Setting list retrieved successfully.',
                'settings' => $settings ?: (object) ['is_on_board' => $user_id['is_on_board']]
            ]);
        } catch (\Throwable $th) {
            Log::error('Error occurred while processing Add Setting API:' . $th->getMessage());
            return response()->json(['status' => false, 'message' => 'An error occurred while processing your request.']);
        }
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
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

            $user_id = User::where('name', $shop)->pluck('id')->first();

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $inputData = $request->input();
            $inputData['user_id'] = $user_id;

            $rules = [
                'status' => 'required|boolean',
                'mix_merge_rate_1' => 'required_if:mix_merge_rate,0',
            ];

            $messages = [
                'status.required' => 'The status is required.',
                'status.boolean' => 'The status field must be true (1) or false (0).',
                'mix_merge_rate_1.required_if' => 'The mix merge rate 1 is required when mix merge rate is yes.',
            ];

            // Validate the request input
            $validator = Validator::make($inputData, $rules, $messages);

            if ($validator->fails()) {
                return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
            }

            $setting = Setting::updateOrCreate(['user_id' => $user_id], $inputData);

            if ($setting->wasRecentlyCreated) {
                $message = 'Setting created successfully.';
            } else {
                $message = 'Setting updated successfully.';
            }

            return response()->json(['status' => true, 'message' => $message]);
        } catch (ValidationException $e) {
            return response()->json(['status' => false, 'message' => $e->validator->errors()]);
        } catch (\Throwable $th) {
            Log::error('Error occurred while processing Add Setting API: ' . $th->getMessage());
            return response()->json(['status' => false, 'message' => 'An error occurred while processing your request.']);
        }
    }


    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }

    public function getSetting($shopName)
    {
        try {
            $user_id = User::where('name', $shopName)->pluck('id')->first();

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $settings = Setting::where('user_id', $user_id)->first();

            return response()->json([
                'status' => true,
                'message' => 'Setting list retrieved successfully.',
                'settings' => $settings ?: (object) []
            ]);
        } catch (\Throwable $th) {
            Log::error('Error occurred while processing Add Setting API:' . $th->getMessage());
            return response()->json(['status' => false, 'message' => 'An error occurred while processing your request.']);
        }
    }

    public function getUserBasedPlans(Request $request)
    {
        try {
            $shop = $request->attributes->get('shopifySession', "kaushik-panot.myshopify.com");

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            // Fetch the token for the shop
            $userId = User::where('name', $shop)->pluck('id')->first();

            if (!$userId) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $plans = Charge::where('user_id', $userId)->select('id', 'user_id', 'status')->first();

            return response()->json([
                'status' => true,
                'message' => 'Shop active plan retrieved successfully.',
                'plan' => $plans
            ]);
        } catch (Throwable $ex) {
            Log::error('Unexpected error when retrieving setting based on token list', ['exception' => $ex->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function onBoardProcess(Request $request)
    {
        try {
            $shop = $request->attributes->get('shopifySession', "kaushik-panot.myshopify.com");

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            // Fetch the token for the shop
            $eventUser = User::where('name', $shop)->first();

            if (!$eventUser) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            if ($eventUser->is_on_board) {
                return response()->json([
                    'status' => true,
                    'message' => 'Carrier service call applied successfully!'
                ], 200);
            }

            $graphqlEndpoint = "https://$shop/admin/api/2024-10/graphql.json";

            // Headers for Shopify API request
            $customHeaders = [
                'X-Shopify-Access-Token' => $eventUser['password'],
            ];

            // GraphQL query for creating a carrier service
            $query = <<<'GRAPHQL'
                mutation carrierServiceCreate($input: DeliveryCarrierServiceCreateInput!) {
                    carrierServiceCreate(input: $input) {
                        carrierService {
                            id
                            name
                            callbackUrl
                            supportsServiceDiscovery
                            active
                        }
                        userErrors {
                            field
                            message
                        }
                    }
                }
                GRAPHQL;

            // Variables for the mutation
            $variables = [
                'input' => [
                    'name' => 'Shipping Rate Provider For Meetanshi',
                    'callbackUrl' => env('VITE_COMMON_API_URL') . "/api/carrier/callback",
                    'supportsServiceDiscovery' => true,
                    'active' => true,
                ],
            ];

            // Prepare the data for the GraphQL request
            $data = [
                'query' => $query,
                'variables' => $variables,
            ];

            // Make the HTTP POST request to Shopify GraphQL endpoint
            $response = Http::withHeaders($customHeaders)->post($graphqlEndpoint, $data);

            // Parse the JSON response
            $jsonResponse = $response->json();

            Log::info("GraphQL User Error: ", ["jsonResponse" => $jsonResponse]);

            // Check for errors in the response
            if (isset($jsonResponse['data']['carrierServiceCreate']['userErrors']) && !empty($jsonResponse['data']['carrierServiceCreate']['userErrors'])) {
                $errors = $jsonResponse['data']['carrierServiceCreate']['userErrors'];
                foreach ($errors as $error) {
                    Log::error("GraphQL User Error: " . $error['message'], ['field' => $error['field']]);
                }
            }

            // Check for carrier service in the response
            $carrier_service_id = $eventUser['carrier_service_id'];
            if (isset($jsonResponse['data']['carrierServiceCreate']['carrierService'])) {
                $carrierService = $jsonResponse['data']['carrierServiceCreate']['carrierService'];
                if (isset($carrierService['id'])) {
                    $carrier_service_id = $carrierService['id'];
                }
                Log::info('Carrier Service Created Successfully', $carrierService);
            }

            // Define the REST API endpoint
            $apiEndpoint = "https://{$eventUser['name']}/admin/api/2024-04/graphql.json";

            // GraphQL query to fetch shop details (currency, timezone, and weight unit)
            $graphqlQuery = <<<GRAPHQL
                    {
                        shop {
                            currency
                            ianaTimezone
                            weightUnit
                        }
                    }
                    GRAPHQL;

            // Make HTTP POST request to Shopify GraphQL API endpoint
            $shopJsonResponse = Http::withHeaders($customHeaders)->post($apiEndpoint, [
                'query' => $graphqlQuery,
            ]);

            $shopData = $shopJsonResponse->json('data.shop');

            // Check if shop data is successfully retrieved
            if (!empty($shopData['currency'])) {
                User::where('id', $eventUser['id'])->update([
                    'shop_currency' => $shopData['currency'],
                    'carrier_service_id' => $carrier_service_id,
                    'shop_timezone' => $shopData['ianaTimezone'],
                    'shop_weight_unit' => $shopData['weightUnit'],
                    'is_on_board' => 1,
                ]);
            } else {
                User::where('id', $eventUser['id'])->update(['is_on_board' => 1, 'carrier_service_id' => $carrier_service_id]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Carrier service call applied successfully!'
            ]);
        } catch (Throwable $ex) {
            Log::error('Unexpected error when retrieving setting based on token list', [
                'message' => $ex->getMessage(),
                'file' => $ex->getFile(),
                'line' => $ex->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'An unexpected error occurred.',
            ], 500);
        }
    }
}
