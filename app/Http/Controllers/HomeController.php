<?php

namespace App\Http\Controllers;

use App\Mail\InstallMail;
use App\Mail\InstallSupportMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class HomeController extends Controller
{
    public function Index(Request $request)
    {
        $post = $request->input();
        $shop = $request->input('shop');
        $host = $request->input('host');

        $shopName = $post['shop'];
        $token = User::where('name', $shopName)->first();

        $graphqlEndpoint = "https://$shopName/admin/api/2024-04/carrier_services.json";

        // Headers for Shopify API request
        $customHeaders = [
            'X-Shopify-Access-Token' => $token['password'],
        ];

        $data = [
            'carrier_service' => [
                'name' => 'Shipping Rate Provider For Meetanshi',
                'callback_url' => env('VITE_COMMON_API_URL') . "/api/carrier/callback",
                'service_discovery' => true,
                'format' => 'json'
            ]
        ];
        // dd($token['password']);
        // Encode the data as JSON
        $jsonData = json_encode($data);
        // Make HTTP POST request to Shopify GraphQL endpoint
        $response = Http::withHeaders($customHeaders)->post($graphqlEndpoint, $data);

        // Parse the JSON response
        $carrier_service_id = $token['carrier_service_id'];
        if(isset($response->json()['carrier_service'])){
            $jsonResponse = $response->json()['carrier_service'];

            if (isset($jsonResponse['id'])) {
                $carrier_service_id = $jsonResponse['id'];
            }
        }

        // Define the REST API endpoint
        $apiEndpoint = "https://{$shop}/admin/api/2024-04/shop.json";

        // Make HTTP GET request to Shopify REST API endpoint
        $shopJsonResponse = Http::withHeaders($customHeaders)->get($apiEndpoint);

        $shopJson = $shopJsonResponse->json();

        if (!empty($shopJson['shop']['currency'])) {
            User::where('id', $token['id'])->update(['shop_currency' => $shopJson['shop']['currency'], 'carrier_service_id' => $carrier_service_id]);
        }

        $this->mendatoryWebhook($shop);
        $this->getStoreOwnerEmail($shop);

        return view('welcome', compact('shop', 'host'));
    }

    public function common(Request $request)
    {
        $shop = $request->input('shop');
        $host = $request->input('host');
        return view('welcome', compact('shop', 'host'));
    }

    private function mendatoryWebhook($shopDetail)
    {
        // Log::info('input logs:', ['shopDetail' => $shopDetail]);

        $token = User::where('name', $shopDetail)->first();

        $topics = [
            'customers/update'
        ];

        $apiVersion = config('services.shopify.api_version');

        $url = "https://{$token['name']}/admin/api/{$apiVersion}/webhooks.json";
        $envUrl = env('VITE_COMMON_API_URL');

        foreach ($topics as $topic) {
            // Create a dynamic webhook address for each topic
            $webhookAddress = "https://{$envUrl}/{$topic}";

            $body = [
                'webhook' => [
                    'address' => $webhookAddress,
                    'topic' => $topic,
                    'format' => 'json'
                ]
            ];

            // Make the HTTP request (you can use Laravel's HTTP client or other libraries)
            $customHeaders = [
                'X-Shopify-Access-Token' => $token['password'], // Replace with your actual authorization token
            ];

            // Send a cURL request to the GraphQL endpoint
            $response = Http::withHeaders($customHeaders)->post($url, $body);
            $jsonResponse = $response->json();

            Log::info('input logs:', ['shopDetail' => $jsonResponse]);
        }
        return true;
    }

    private function getStoreOwnerEmail($shop)
    {
        try {
            // Fetch the Shopify API token from the User model
            $token = User::where('name', $shop)->value('password');

            if (!$token) {
                Log::error("No API token found for shop: {$shop}");
                return false;
            }

            // Get the Shopify API version from the config
            $apiVersion = config('services.shopify.api_version');

            // Construct the Shopify API endpoint URL
            $shopUrl = "https://{$shop}/admin/api/{$apiVersion}/shop.json";

            // Send a GET request to the Shopify API
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-Shopify-Access-Token' => $token,
            ])->get($shopUrl);

            // Check for HTTP errors
            if ($response->failed()) {
                Log::error("Failed to retrieve shop details for: {$shop}", ['response' => $response->body()]);
                return false;
            }

            // Decode the response body as an array
            $data = $response->json();

            if (!isset($data['shop'])) {
                Log::error("Shop data is not available in the response.", ['response' => $data]);
                return false;
            }

            // Extract shop details
            $storeOwnerEmail = $data['shop']['email'] ?? 'default@example.com'; // Default email if not found
            $storeName = $data['shop']['name'];
            $shopOwner = $data['shop']['shop_owner'];
            $shopDomain = $data['shop']['domain'];

            // Optionally update the user with store owner email and store name
            // User::where('name', $shop)->update([
            //     'store_owner_email' => $storeOwnerEmail,
            //     'store_name' => $storeName,
            // ]);

            // Send emails
            Mail::to("bhushan.trivedi@meetanshi.com")->send(new InstallMail($shopOwner, $shopDomain));

            return true;
        } catch (\Exception $e) {
            Log::error("An error occurred while getting store owner email.", [
                'shop' => $shop,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
