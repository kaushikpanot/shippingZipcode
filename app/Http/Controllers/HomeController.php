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
        User::where('name', $shopName)->update(['is_on_board'=>0]);

        $this->handleInstallMail($shopName);

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
}
