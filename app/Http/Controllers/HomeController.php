<?php

namespace App\Http\Controllers;

use App\Events\ProcessDataEvent;
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

        if($token){
            $shopDetail = [
                "name" => $token['name'],
                "password" => $token['password']
            ];

            event(new ProcessDataEvent($token));

            $this->mendatoryWebhook($shopDetail);
        }

        return view('welcome', compact('shop', 'host'));
    }

    public function common(Request $request)
    {
        $shop = $request->input('shop');
        $host = $request->input('host');
        return view('welcome', compact('shop', 'host'));
    }

    private function mendatoryWebhook($token)
    {
        Log::info('input logs:', ['shopDetail' => $token]);

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
}
