<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class HomeController extends Controller
{
    public function Index(Request $request){
        $post = $request->input();
        $shop = $request->input('shop');

         Log::info('App', $post);
        return view('welcome',compact('shop'));
    }

    public function common(Request $request){
        $shop = $request->input('shop');
        return view('welcome',compact('shop'));
    }
}
