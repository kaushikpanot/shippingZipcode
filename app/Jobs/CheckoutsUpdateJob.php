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
        if (isset($this->webhookData['customer'])) {

            $shopDomain = request()->header();

            $shopName = $shopDomain['x-shopify-shop-domain'][0];

            $token = User::where('name', $shopName)->first();

            if (null != $token['carrier_service_id']) {
                $graphqlEndpoint = "https://$shopName/admin/api/2024-04/carrier_services/{$token['carrier_service_id']}.json";

                $customHeaders = [
                    'X-Shopify-Access-Token' => $token['password'],
                ];

                $data = [
                    'carrier_service' => [
                        'callback_url' => env('VITE_COMMON_API_URL') . "/api/carrier/callback/{$this->webhookData['customer']['id']}",
                        'format' => 'json'
                    ]
                ];

                Http::withHeaders($customHeaders)->put($graphqlEndpoint, $data);

                $seconds = 2700;
                $customerData = [
                    'id' => $this->webhookData['customer']['id'],
                    'orders_count' => $this->webhookData['customer']['orders_count'],
                    'total_spent' => $this->webhookData['customer']['total_spent'],
                    'phone' => $this->webhookData['customer']['phone'],
                    'tags' => $this->webhookData['customer']['tags'],
                ];

                Cache::put($this->webhookData['customer']['id'], ["customer" => $customerData], $seconds);
            }
        }
    }
}
