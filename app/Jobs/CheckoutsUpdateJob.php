<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CheckoutsUpdateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $webhookData;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        $this->webhookData = request()->input();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (!is_null($this->webhookData['email'])) {
            $domain = explode('@', $this->webhookData['email'])[0];
        } else {
            $domain = $this->webhookData['phone'];
        }
        // Log::info('Email cataco', ['mainEmail' => $this->webhookData['discount_codes'][0]['code']]);
        $customerData = [
            'compare_email' => $this->webhookData['email'],
            'coupon_code' => $this->webhookData['discount_codes'][0]['code'] ?? null,
        ];

        $shopDomain = request()->header();

        $shopName = $shopDomain['x-shopify-shop-domain'][0];

        $token = User::where('name', $shopName)->first();

        if (null != $token['carrier_service_id']) {
            $graphqlEndpoint = "https://$shopName/admin/api/2024-10/graphql.json";

            // Headers for Shopify API request
            $customHeaders = [
                'X-Shopify-Access-Token' => $token['password'],
            ];

            // GraphQL query for creating a carrier service
            $query = <<<'GRAPHQL'
                mutation carrierServiceUpdate($input: DeliveryCarrierServiceUpdateInput!) {
                    carrierServiceUpdate(input: $input) {
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
                    'callbackUrl' => env('VITE_COMMON_API_URL') . "/api/carrier/callback/{$domain}",
                    'id' => $token['carrier_service_id'],
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

            if (isset($jsonResponse['data']['carrierServiceCreate']['carrierService'])) {
                $carrierService = $jsonResponse['data']['carrierServiceCreate']['carrierService'];
                Log::info('Carrier Service Created Successfully', $carrierService);
            }

            if (isset($this->webhookData['customer'])) {
                $customerData = array_merge($customerData, [
                    'id' => $this->webhookData['customer']['id'] ?? null,
                    'orders_count' => $this->webhookData['customer']['orders_count'] ?? 0,
                    'total_spent' => $this->webhookData['customer']['total_spent'] ?? 0.0,
                    'phone' => $this->webhookData['customer']['phone'] ?? $this->webhookData['phone'],
                    'tags' => $this->webhookData['customer']['tags'] ?? '',
                    'email' => $this->webhookData['customer']['email'] ?? $this->webhookData['email'],
                ]);
            }

            $seconds = 2700;
            Cache::put($domain, ["customer" => $customerData], $seconds);
        }
    }
}
