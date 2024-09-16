<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ShopUpdateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $webhookData;

    /**
     * Create a new job instance.
     */
    public function __construct($webhookData)
    {
        $this->webhookData = request()->all();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $shopDomain = $this->webhookData['domain'];
        $user = User::where('name', $shopDomain)->first();

        if($user){
            $user->update([
                'shop_weight_unit'=>$this->webhookData['weight_unit'],
                'shop_currency' => $this->webhookData['currency'],
                'shop_timezone' => $this->webhookData['iana_timezone']
            ]);
        }
        // Log::info('Processing shop update webhook:', $this->webhookData);
        // Log::info('Processing shop update webhook:', ['shopDomain'=>$shopDomain]);
    }
}
