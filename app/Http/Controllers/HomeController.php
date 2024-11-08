<?php

namespace App\Http\Controllers;

use App\Events\ProcessDataEvent;
use App\Jobs\SendEmailJob;
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

        $this->handleInstallMail($shopName);



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
            $user = User::where('name', $shopDomain)->first();

            $graphqlEndpoint = "https://$shopDomain/admin/api/2024-07/graphql.json";

            // Headers for Shopify API request
            $customHeaders = [
                'X-Shopify-Access-Token' => $user['password'],
            ];

            $query = <<<GRAPHQL
                {
                    shop {
                        name
                        email
                    }
                }
                GRAPHQL;

            // Make HTTP POST request to Shopify GraphQL endpoint
            $response = Http::withHeaders($customHeaders)->post($graphqlEndpoint, [
                'query' => $query,
            ]);
            // dd($response->json());
            // Parse the JSON response
            $jsonResponse = $response->json();

            $name = explode('@', $shopDomain)[0];

            if ($shopDomain) {

                $emailData = [
                    // "to" => "sanjay@meetanshi.com",
                    // "to" => "bhushan.trivedi@meetanshi.com",
                    "to" => $jsonResponse['data']['shop']['email'] ?? "sanjay@meetanshi.com",
                    'name' => $name,
                    'shopDomain' => $shopDomain,
                ];

                $emailData1 = [
                    // "to" => "sanjay@meetanshi.com",
                    // "to" => "bhushan.trivedi@meetanshi.com",
                    "to" => "sanjay@meetanshi.com",
                    'name' => $name,
                    'shopDomain' => $shopDomain,
                ];

                Log::info('User email data:',['emailData'=>$emailData]);
                Log::info('User email data:',['emailData1'=>$emailData1]);

                SendEmailJob::dispatch($emailData, InstallMail::class)->onQueue('emails');
                SendEmailJob::dispatch($emailData1, InstallMail::class)->onQueue('emails');

                // Mail::to("bhushan.trivedi@meetanshi.com")->send(new InstallMail($name, $shopDomain));
                // Mail::to("bhushan.trivedi@meetanshi.com")->send(new InstallMail($name, $shopDomain));

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

    protected function getStoreOwnerEmail($shop)
    {
        $user = $shop;
        $shop_url = "https://" . $user['name'] . "/admin/api/2024-07/shop.json";
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => $shop_url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "GET",
            CURLOPT_HTTPHEADER => [
                "Content-Type: application/json",
                "X-Shopify-Access-Token:" . $user['password']
            ],
        ]);

        $response = curl_exec($curl);
        $err = curl_error($curl);

        curl_close($curl);

        if ($err) {
            return false;
        } else {
            $data = json_decode($response, true);

            if (@$data['shop']) {

                $storeOwnerEmail = $data['shop']['email'];
                $store_name = $data['shop']['name'];
                User::where('name', $user['name'])->update(['store_owner_email' => $storeOwnerEmail, 'store_name' => $store_name,'isInstall'=>1]);
                $details = [
                    'title' => 'Thank You for Installing Call For Price for Shopify - Meetanshi',
                    'name' => $store_name
                ];

              //  \Mail::to($storeOwnerEmail)->send(new \App\Mail\InstallMail($details));
             //    \Mail::to("krishna.patel@meetanshi.com")->send(new \App\Mail\InstallMail($details));
                return true;
            }
        }
    }
}
