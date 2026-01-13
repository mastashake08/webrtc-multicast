<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreRtmpUrlRequest;
use App\Http\Requests\Api\UpdateRtmpUrlRequest;
use App\Models\RtmpUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RtmpUrlController extends Controller
{
    /**
     * Display a listing of the authenticated user's RTMP URLs.
     */
    public function index(Request $request): JsonResponse
    {
        $rtmpUrls = $request->user()
            ->rtmpUrls()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $rtmpUrls,
        ]);
    }

    /**
     * Store a newly created RTMP URL.
     */
    public function store(StoreRtmpUrlRequest $request): JsonResponse
    {
        $rtmpUrl = $request->user()->rtmpUrls()->create($request->validated());

        return response()->json([
            'message' => 'RTMP URL created successfully',
            'data' => $rtmpUrl,
        ], 201);
    }

    /**
     * Display the specified RTMP URL.
     */
    public function show(Request $request, RtmpUrl $rtmpUrl): JsonResponse
    {
        if ($rtmpUrl->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        return response()->json([
            'data' => $rtmpUrl,
        ]);
    }

    /**
     * Update the specified RTMP URL.
     */
    public function update(UpdateRtmpUrlRequest $request, RtmpUrl $rtmpUrl): JsonResponse
    {
        $rtmpUrl->update($request->validated());

        return response()->json([
            'message' => 'RTMP URL updated successfully',
            'data' => $rtmpUrl->fresh(),
        ]);
    }

    /**
     * Remove the specified RTMP URL.
     */
    public function destroy(Request $request, RtmpUrl $rtmpUrl): JsonResponse
    {
        if ($rtmpUrl->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $rtmpUrl->delete();

        return response()->json([
            'message' => 'RTMP URL deleted successfully',
        ]);
    }

    /**
     * Toggle the active status of an RTMP URL.
     */
    public function toggle(Request $request, RtmpUrl $rtmpUrl): JsonResponse
    {
        if ($rtmpUrl->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $rtmpUrl->update([
            'is_active' => !$rtmpUrl->is_active,
        ]);

        return response()->json([
            'message' => 'RTMP URL status toggled successfully',
            'data' => $rtmpUrl->fresh(),
        ]);
    }
}
