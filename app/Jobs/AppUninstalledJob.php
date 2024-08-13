<?php

namespace App\Jobs;

use App\Mail\UninstallEmail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AppUninstalledJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $data;

    /**
     * Create a new job instance.
     */
    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $data = file_get_contents('php://input');

            // Check if the received data is valid JSON
            if ($data === false) {
                Log::warning('Failed to get input data');
                return;
            }

            $data_json = json_decode($data, true);

            // Check if JSON decoding is successful
            if ($data_json === null) {
                Log::warning('Failed to decode JSON data:', ['data' => $data]);
                return;
            }

            Log::info('Decoded Webhook Data:', ['data' => $data_json]);

            // $to = $data_json['email'];
            $to = "kaushik.panot@meetanshi.com";
            $name = $data_json['shop_owner'];
            $shopDomain = $data_json['domain'];

            Log::info('Webhook Information:', [
                'to' => $to,
                'name' => $name,
                'shopDomain' => $shopDomain,
            ]);

            $user = User::where('name', $shopDomain)->first();

            if ($user) {
                $user->password = "";
                $user->save();
            } else {
                Log::warning('User not found for shop domain: ' . $shopDomain);
            }

            Mail::to($to)->send(new UninstallEmail($name, $shopDomain));
            // Mail::to("panotkaushik@gmail.com")->send(new UninstallEmail($name, $shopDomain));

            Log::info('User password successfully!');
        } catch (\Throwable $e) {
            Log::error('Error processing webhook:', ['error' => $e->getMessage()]);
        }
    }
}
