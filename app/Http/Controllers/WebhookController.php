<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handleCheckoutsCreate(Request $request)
    {
        Log::info('Received checkouts/create webhook:', $request->all());

        // Process the webhook data
        // ...

        return response()->json(['status' => 'success'], 200);
    }

    public function handleCartsCreate(Request $request)
    {
        // Log the incoming request for debugging purposes
        Log::info('Received carts/create webhook:', $request->all());

        // You can add additional processing logic here if needed
        // ...

        // Respond with a 200 status code to acknowledge receipt of the webhook
        return response()->json(['status' => 'success'], 200);
    }

    private function verifyWebhookInternal($data, $hmacHeader)
    {
        $apiSecret = config('shopify-app.api_secret');
        $calculatedHmac = base64_encode(hash_hmac('sha256', $data, $apiSecret, true));
        return hash_equals($calculatedHmac, $hmacHeader);
    }

    public function customersUpdate(Request $request)
    {
        $hmacHeader = $request->header('X-Shopify-Hmac-Sha256');
        $data = $request->getContent();
        $utf8 = utf8_encode($data);
        $txt = json_decode($utf8, true);

        $verified = $this->verifyWebhookInternal($data, $hmacHeader);

        if ($verified) {
            Log::info("customer update request");
            return response()->json(['status' => 'success'], 200);
        } else {
            Log::info("customer update fail request");
            return response()->json(['status' => 'error'], 401);
        }
    }

    public function customersDelete(Request $request)
    {
        $hmacHeader = $request->header('X-Shopify-Hmac-Sha256');
        $data = $request->getContent();
        $utf8 = utf8_encode($data);
        $txt = json_decode($utf8, true);

        $verified = $this->verifyWebhookInternal($data, $hmacHeader);

        if ($verified) {
            Log::info("customer delete request");
            return response()->json(['status' => 'success'], 200);
        } else {
            Log::info("customer delete fail request");
            return response()->json(['status' => 'error'], 401);
        }
    }
}
