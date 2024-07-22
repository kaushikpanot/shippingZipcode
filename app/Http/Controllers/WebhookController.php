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
}
