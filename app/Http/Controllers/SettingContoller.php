<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SettingContoller extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        try {

            // $shop = $request->attributes->get('shopifySession');
            $shop = "krishnalaravel-test.myshopify.com";

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

            $settings = Setting::where('user_id', $user_id)->first();

            return response()->json([
                'status' => true,
                'message' => 'Setting list retrieved successfully.',
                'settings' => $settings ?: (object) []
            ]);
        } catch (\Throwable $th) {
            Log::error('Error occurred while processing Add Setting API:' . $th->getMessage());
            return response()->json(['status' => false, 'message' => 'An error occurred while processing your request.']);
        }
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        try {

            // $shop = $request->attributes->get('shopifySession');
            $shop = "krishnalaravel-test.myshopify.com";

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

            Setting::updateOrCreate(['user_id' => $user_id], $request->input());

            return response()->json(['status' => true, 'message' => 'Setting added successfully.']);
        } catch (ValidationException $e) {
            return response()->json(['status' => false, 'message' => $e->validator->errors()]);
        } catch (\Throwable $th) {
            Log::error('Error occurred while processing Add Setting API: ' . $th->getMessage());
            return response()->json(['status' => false, 'message' => 'An error occurred while processing your request.']);
        }
    }


    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }

    public function getSetting($shopName)
    {
        try {
            $user_id = User::where('name', $shopName)->pluck('id')->first();

            if (!$user_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $settings = Setting::where('user_id', $user_id)->first();

            return response()->json([
                'status' => true,
                'message' => 'Setting list retrieved successfully.',
                'settings' => $settings ?: (object) []
            ]);
        } catch (\Throwable $th) {
            Log::error('Error occurred while processing Add Setting API:' . $th->getMessage());
            return response()->json(['status' => false, 'message' => 'An error occurred while processing your request.']);
        }
    }
}
