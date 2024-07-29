<?php

namespace App\Http\Controllers;

use App\Models\MixMergeRate;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MixMergeRateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $shop = $request->attributes->get('shopifySession');
            // $shop = "jaypal-demo.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            $user_id = User::where('name', $shop)->pluck('id')->first();

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $mixMergeRates = MixMergeRate::where('user_id', $user_id);

            if (null !== $request->input('setting_id')) {
                $mixMergeRates = $mixMergeRates->where('setting_id', $request->input('setting_id'));
            }

            $mixMergeRates = $mixMergeRates->get();

            return response()->json([
                'status' => true,
                'message' => 'Mix merge rate list retrieved successfully.',
                'mixMergeRates' => $mixMergeRates
            ]);

        } catch (\Throwable $th) {
            Log::error('Error occurred while processing Add Setting API:' . $th->getMessage());
            return response()->json(['status' => false, 'message' => 'An error occurred while processing your request.']);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $shop = $request->attributes->get('shopifySession');
            // $shop = "jaypal-demo.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            $user_id = User::where('name', $shop)->pluck('id')->first();

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $inputData = $request->input();
            $inputData['user_id'] = $user_id;

            $rules = [
                'user_id' => 'required|exists:users,id', // Ensure the user exists
                // 'setting_id' => 'required|exists:settings,id', // Ensure the setting exists
                'rate_name' => 'required|string|max:255', // Ensure it's a string with a reasonable length
                'condition' => 'required|integer', // Fixed typo from 'intizer' to 'integer'
                'price_calculation_type' => 'required|integer',
                'tags_to_combine' => 'required', // Ensure it's an array
                'status' => 'required|boolean',
            ];

            $messages = [
                'user_id.required' => 'The user ID is required.',
                'user_id.exists' => 'The selected user ID does not exist.',
                // 'setting_id.required' => 'The setting ID is required.',
                // 'setting_id.exists' => 'The selected setting ID does not exist.',
                'rate_name.required' => 'The rate name is required.',
                'rate_name.string' => 'The rate name must be a valid string.',
                'rate_name.max' => 'The rate name may not be greater than 255 characters.',
                'condition.required' => 'The condition is required.',
                'condition.integer' => 'The condition must be an integer.',
                'price_calculation_type.required' => 'The price calculation type is required.',
                'price_calculation_type.integer' => 'The price calculation type must be an integer.',
                'tags_to_combine.required' => 'Tags to combine are required.',
                'status.required' => 'The status is required.',
                'status.boolean' => 'The status field must be true (1) or false (0).',
            ];

            // Validate the request input
            $validator = Validator::make($inputData, $rules, $messages);


            if ($validator->fails()) {
                return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
            }

            $mergeRate = MixMergeRate::updateOrCreate(['id' => $request->input('id')], $inputData);

            if ($mergeRate->wasRecentlyCreated) {
                $message = 'Mix merge rate created successfully.';
            } else {
                $message = 'Mix merge rate updated successfully.';
            }

            return response()->json(['status' => true, 'message' => $message]);
        } catch (ValidationException $e) {
            return response()->json(['status' => false, 'message' => $e->validator->errors()]);
        } catch (\Throwable $th) {
            Log::error('Error occurred while processing Add Setting API: ' . $th->getMessage());
            return response()->json(['status' => false, 'message' => 'An error occurred while processing your request.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        try {
            $shop = request()->attributes->get('shopifySession');
            // $shop = "jaypal-demo.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            $user_id = User::where('name', $shop)->pluck('id')->first();

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $mixMergeRate = MixMergeRate::find($id);

            return response()->json([
                'status' => true,
                'message' => 'Mix merge rate retrieved successfully.',
                'mixMergeRate' => $mixMergeRate ?: (object) []
            ]);

        } catch (\Throwable $th) {
            Log::error('Error occurred while processing Add Setting API: ' . $th->getMessage());
            return response()->json(['status' => false, 'message' => 'An error occurred while processing your request.']);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $shop = request()->attributes->get('shopifySession');
            // $shop = "jaypal-demo.myshopify.com";

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token not provided.'
                ], 400);
            }

            $user_id = User::where('name', $shop)->pluck('id')->first();

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $rate = MixMergeRate::where('user_id', $user_id)->findOrFail($id);

            $rate->delete();

            return response()->json([
                'status' => true,
                'message' => 'Mix merge rate deleted successfully.'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['status' => false, 'message' => 'Mix Rate not found.']);
        } catch (\Throwable $th) {
            Log::error('Unexpected rate delete error', ['exception' => $th->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred.'], 500);
        }
    }
}
