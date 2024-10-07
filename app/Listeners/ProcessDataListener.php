<?php

namespace App\Listeners;

use App\Events\ProcessDataEvent;
use App\Mail\InstallMail;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ProcessDataListener
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(ProcessDataEvent $event): void
    {
        Log::info($event->user);
        $eventUser = $event->user;

        $graphqlEndpoint = "https://{$eventUser['name']}/admin/api/2024-04/carrier_services.json";

        // // Headers for Shopify API request
        $customHeaders = [
            'X-Shopify-Access-Token' => $eventUser['password'],
        ];

        $data = [
            'carrier_service' => [
                'name' => 'Shipping Rate Provider For Meetanshi',
                'callback_url' => env('VITE_COMMON_API_URL') . "/api/carrier/callback",
                'service_discovery' => true,
                'format' => 'json'
            ]
        ];
        // // dd($token['password']);
        // // Encode the data as JSON
        $jsonData = json_encode($data);
        // // Make HTTP POST request to Shopify GraphQL endpoint
        $response = Http::withHeaders($customHeaders)->post($graphqlEndpoint, $data);

        // // Parse the JSON response
        $carrier_service_id = $eventUser['carrier_service_id'];
        if(isset($response->json()['carrier_service'])){
            $jsonResponse = $response->json()['carrier_service'];

            if (isset($jsonResponse['id'])) {
                $carrier_service_id = $jsonResponse['id'];
            }
        }

        // // Define the REST API endpoint
        $apiEndpoint = "https://{$eventUser['name']}/admin/api/2024-04/shop.json";

        // // Make HTTP GET request to Shopify REST API endpoint
        $shopJsonResponse = Http::withHeaders($customHeaders)->get($apiEndpoint);

        $shopJson = $shopJsonResponse->json();

        if (!empty($shopJson['shop']['currency'])) {
            User::where('id', $eventUser['id'])->update(['shop_currency' => $shopJson['shop']['currency'], 'carrier_service_id' => $carrier_service_id, 'shop_timezone' => $shopJson['shop']['iana_timezone'], "shop_weight_unit"=>$shopJson['shop']['weight_unit']]);
        }

        // // Extract shop details
        // $storeOwnerEmail = $shopJson['shop']['email'] ?? 'kaushik.panot@meetanshi.com'; // Default email if not found
        // $storeName = $shopJson['shop']['name'];
        // $shopOwner = $shopJson['shop']['shop_owner'];
        // $shopDomain = $shopJson['shop']['domain'];

        // // Mail::to("kaushik.panot@meetanshi.com")->send(new InstallMail($shopOwner, $shopDomain));
        // Mail::to("bhushan.trivedi@meetanshi.com")->send(new InstallMail($shopOwner, $shopDomain));
    }
}
