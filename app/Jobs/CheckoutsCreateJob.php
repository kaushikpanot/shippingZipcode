<?php

namespace App\Jobs;

use GuzzleHttp\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
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
        if (isset($this->webhookData['customer'])) {
            // Log::info("CheckoutsCreateJob", ["webhookData" => $this->webhookData]);
            Cache::forever('customerData', ["customer" => $this->webhookData['customer']]);
            // Session::put('customerData', ["customer"=>$this->webhookData['customer']]);
        } else {
            // Log::info("CheckoutsCreateJob", ["webhookData" => $this->webhookData]);
            Cache::forever('customerData', ["customer" => ""]);
            // Session::put('customerData', ["customer"=>""]);
        }
    }
}
