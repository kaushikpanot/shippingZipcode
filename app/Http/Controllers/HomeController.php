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
        // $token = User::where('name', $shopName)->first();
        User::where('name', $shopName)->update(['is_on_board'=>0]);

        // if ($token) {
        //     $shopDetail = [
        //         "name" => $token['name'],
        //         "password" => $token['password']
        //     ];

        //     // event(new ProcessDataEvent($token));

        //     // $this->handleInstallMail($token);
        // }

        return view('welcome', compact('shop', 'host'));
    }

    public function common(Request $request)
    {
        $shop = $request->input('shop');
        $host = $request->input('host');
        return view('welcome', compact('shop', 'host'));
    }

    public function handleInstallMail($shopDomain)
    {
        if ($shopDomain) {
            // Perform your logic here, e.g., clean up the database, revoke tokens, etc.
            // Example: Delete the shop from the database
            // $user = User::where('name', $shopDomain)->first();
            $name = explode('@', $shopDomain)[0];

            if ($shopDomain) {

                Mail::to("bhushan.trivedi@meetanshi.com")->send(new InstallMail($name, $shopDomain));

            } else {
                Log::warning('User not found for shop domain: ' . $shopDomain);
            }
        }

        return response()->json(['message' => 'Install mail sent successfully'], 200);
    }

    // private function mandatoryWebhook($token)
    // {
    //     Log::info('input logs:', ['shopDetail' => $token]);

    //     $topics = [
    //         'customers/update'
    //     ];

    //     $apiVersion = config('services.shopify.api_version');
    //     $url = "https://{$token['name']}/admin/api/{$apiVersion}/webhooks.json";
    //     $envUrl = env('VITE_COMMON_API_URL');

    //     // Prepare webhook data for all topics in one request
    //     $webhooks = [];
    //     foreach ($topics as $topic) {
    //         $webhooks[] = [
    //             'address' => "https://{$envUrl}/{$topic}",
    //             'topic' => $topic,
    //             'format' => 'json'
    //         ];
    //     }

    //     $body = [
    //         'webhooks' => $webhooks
    //     ];

    //     $customHeaders = [
    //         'X-Shopify-Access-Token' => $token['password'],
    //     ];

    //     // Make a single HTTP request to create all webhooks at once
    //     $response = Http::withHeaders($customHeaders)->post($url, $body);
    //     $jsonResponse = $response->json();

    //     Log::info('Webhook creation response:', ['response' => $jsonResponse]);

    //     return true;
    // }

    // private function mendatoryWebhook($token)
    // {
    //     Log::info('input logs:', ['shopDetail' => $token]);

    //     $topics = [
    //         'customers/update'
    //     ];

    //     $apiVersion = config('services.shopify.api_version');

    //     $url = "https://{$token['name']}/admin/api/{$apiVersion}/webhooks.json";
    //     $envUrl = env('VITE_COMMON_API_URL');

    //     foreach ($topics as $topic) {
    //         // Create a dynamic webhook address for each topic
    //         $webhookAddress = "https://{$envUrl}/{$topic}";

    //         $body = [
    //             'webhook' => [
    //                 'address' => $webhookAddress,
    //                 'topic' => $topic,
    //                 'format' => 'json'
    //             ]
    //         ];

    //         // Make the HTTP request (you can use Laravel's HTTP client or other libraries)
    //         $customHeaders = [
    //             'X-Shopify-Access-Token' => $token['password'], // Replace with your actual authorization token
    //         ];

    //         // Send a cURL request to the GraphQL endpoint
    //         $response = Http::withHeaders($customHeaders)->post($url, $body);
    //         $jsonResponse = $response->json();

    //         Log::info('input logs:', ['shopDetail' => $jsonResponse]);
    //     }
    //     return true;
    // }
}
