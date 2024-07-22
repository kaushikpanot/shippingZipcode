<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;

class CheckoutsCreateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    protected $webhookData;
    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        $this->webhookData = request()->all();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Hello");
        // $customer_id = $this->webhookData['customer']['id'];

        // $graphqlEndpoint = "https://jaypal-demo.myshopify.com/admin/api/2024-04/carrier_services/69713461497.json";

        // // Headers for Shopify API request
        // $customHeaders = [
        //     'X-Shopify-Access-Token' => 'shpua_f6ab89d02602242cc83b47c3c4d64946',
        // ];
        // Log::info('Query logs:', ['call' => $customer_id]);

        // $data = [
        //     'carrier_service' => [
        //         'name' => 'Shipping Rate Provider For Meetanshi',
        //         'callback_url' => env('VITE_COMMON_API_URL') . "/api/carrier/callback?customer_id=" . $customer_id,
        //         'service_discovery' => true,
        //         'format' => 'json',
        //     ]
        // ];

        // // Encode the data as JSON
        // $jsonData = json_encode($data);
        // // Make HTTP POST request to Shopify GraphQL endpoint
        // $response = Http::withHeaders($customHeaders)->put($graphqlEndpoint, $data);

        // // Parse the JSON response
        // $jsonResponse = $response->json();
    }
}
