<?php

use App\Http\Controllers\Api\RtmpUrlController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('rtmp-urls', RtmpUrlController::class);
    Route::post('rtmp-urls/{rtmp_url}/toggle', [RtmpUrlController::class, 'toggle']);
});

