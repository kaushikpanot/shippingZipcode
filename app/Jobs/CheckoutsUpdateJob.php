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
            $graphqlEndpoint = "https://$shopName/admin/api/2024-04/carrier_services/{$token['carrier_service_id']}.json";

            $customHeaders = [
                'X-Shopify-Access-Token' => $token['password'],
            ];

            $data = [
                'carrier_service' => [
                    'callback_url' => env('VITE_COMMON_API_URL') . "/api/carrier/callback/{$domain}",
                    'format' => 'json'
                ]
            ];

            Http::withHeaders($customHeaders)->put($graphqlEndpoint, $data);

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
