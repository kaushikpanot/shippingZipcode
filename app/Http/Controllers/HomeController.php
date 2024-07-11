<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
                'service_discovery' => true
            ]
        ];

        // Encode the data as JSON
        $jsonData = json_encode($data);
        // Make HTTP POST request to Shopify GraphQL endpoint
        $response = Http::withHeaders($customHeaders)->post($graphqlEndpoint, $data);

        // Parse the JSON response
        $jsonResponse = $response->json();

        // Define the REST API endpoint
        $apiEndpoint = "https://{$shop}/admin/api/2024-04/shop.json";

        // Make HTTP GET request to Shopify REST API endpoint
        $shopJsonResponse = Http::withHeaders($customHeaders)->get($apiEndpoint);

        $shopJson = $shopJsonResponse->json();

        if(!empty($shopJson['shop']['currency'])){
            User::where('id',$token['id'])->update(['shop_currency'=>$shopJson['shop']['currency']]);
        }

        return view('welcome', compact('shop', 'host'));
    }

    public function common(Request $request)
    {
        $shop = $request->input('shop');
        $host = $request->input('host');
        return view('welcome', compact('shop', 'host'));
    }
}
