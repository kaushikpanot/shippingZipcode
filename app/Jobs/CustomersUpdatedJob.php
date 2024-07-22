<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CustomersUpdatedJob implements ShouldQueue
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
        Log::info('Received customers/create webhook:', $this->webhookData);
    }
}
