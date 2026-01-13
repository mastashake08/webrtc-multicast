<?php

use App\Models\RtmpUrl;
use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\patchJson;
use function Pest\Laravel\postJson;

test('authenticated user can list their rtmp urls', function () {
    $user = User::factory()->create();
    $rtmpUrls = RtmpUrl::factory()->count(3)->create(['user_id' => $user->id]);
    $otherUserUrls = RtmpUrl::factory()->count(2)->create();

    $response = actingAs($user)->getJson('/api/rtmp-urls');

    $response->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'user_id', 'name', 'url', 'platform', 'is_active', 'created_at', 'updated_at'],
            ],
        ]);
});

test('unauthenticated user cannot access rtmp urls', function () {
    $response = getJson('/api/rtmp-urls');

    $response->assertUnauthorized();
});

test('authenticated user can create rtmp url', function () {
    $user = User::factory()->create();
    $data = [
        'name' => 'YouTube Live',
        'url' => 'rtmp://a.rtmp.youtube.com/live2/test-key',
        'platform' => 'YouTube',
        'is_active' => true,
    ];

    $response = actingAs($user)->postJson('/api/rtmp-urls', $data);

    $response->assertCreated()
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'user_id', 'name', 'url', 'platform', 'is_active'],
        ]);

    assertDatabaseHas('rtmp_urls', [
        'user_id' => $user->id,
        'name' => 'YouTube Live',
        'url' => 'rtmp://a.rtmp.youtube.com/live2/test-key',
        'platform' => 'YouTube',
        'is_active' => true,
    ]);
});

test('rtmp url creation requires valid rtmp url', function () {
    $user = User::factory()->create();

    $response = actingAs($user)->postJson('/api/rtmp-urls', [
        'name' => 'Invalid URL',
        'url' => 'https://example.com/stream',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['url']);
});

test('rtmp url creation validates required fields', function () {
    $user = User::factory()->create();

    $response = actingAs($user)->postJson('/api/rtmp-urls', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'url']);
});

test('authenticated user can view their rtmp url', function () {
    $user = User::factory()->create();
    $rtmpUrl = RtmpUrl::factory()->create(['user_id' => $user->id]);

    $response = actingAs($user)->getJson("/api/rtmp-urls/{$rtmpUrl->id}");

    $response->assertOk()
        ->assertJson([
            'data' => [
                'id' => $rtmpUrl->id,
                'name' => $rtmpUrl->name,
                'url' => $rtmpUrl->url,
            ],
        ]);
});

test('user cannot view another users rtmp url', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $rtmpUrl = RtmpUrl::factory()->create(['user_id' => $otherUser->id]);

    $response = actingAs($user)->getJson("/api/rtmp-urls/{$rtmpUrl->id}");

    $response->assertForbidden();
});

test('authenticated user can update their rtmp url', function () {
    $user = User::factory()->create();
    $rtmpUrl = RtmpUrl::factory()->create(['user_id' => $user->id]);

    $response = actingAs($user)->patchJson("/api/rtmp-urls/{$rtmpUrl->id}", [
        'name' => 'Updated Name',
        'is_active' => false,
    ]);

    $response->assertOk()
        ->assertJson([
            'message' => 'RTMP URL updated successfully',
            'data' => [
                'id' => $rtmpUrl->id,
                'name' => 'Updated Name',
                'is_active' => false,
            ],
        ]);

    assertDatabaseHas('rtmp_urls', [
        'id' => $rtmpUrl->id,
        'name' => 'Updated Name',
        'is_active' => false,
    ]);
});

test('authenticated user can delete their rtmp url', function () {
    $user = User::factory()->create();
    $rtmpUrl = RtmpUrl::factory()->create(['user_id' => $user->id]);

    $response = actingAs($user)->deleteJson("/api/rtmp-urls/{$rtmpUrl->id}");

    $response->assertOk()
        ->assertJson(['message' => 'RTMP URL deleted successfully']);

    assertDatabaseMissing('rtmp_urls', ['id' => $rtmpUrl->id]);
});

test('user cannot delete another users rtmp url', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $rtmpUrl = RtmpUrl::factory()->create(['user_id' => $otherUser->id]);

    $response = actingAs($user)->deleteJson("/api/rtmp-urls/{$rtmpUrl->id}");

    $response->assertForbidden();
    assertDatabaseHas('rtmp_urls', ['id' => $rtmpUrl->id]);
});

test('authenticated user can toggle rtmp url status', function () {
    $user = User::factory()->create();
    $rtmpUrl = RtmpUrl::factory()->create(['user_id' => $user->id, 'is_active' => true]);

    $response = actingAs($user)->postJson("/api/rtmp-urls/{$rtmpUrl->id}/toggle");

    $response->assertOk()
        ->assertJson([
            'message' => 'RTMP URL status toggled successfully',
            'data' => [
                'id' => $rtmpUrl->id,
                'is_active' => false,
            ],
        ]);

    assertDatabaseHas('rtmp_urls', [
        'id' => $rtmpUrl->id,
        'is_active' => false,
    ]);
});

test('user cannot toggle another users rtmp url', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $rtmpUrl = RtmpUrl::factory()->create(['user_id' => $otherUser->id, 'is_active' => true]);

    $response = actingAs($user)->postJson("/api/rtmp-urls/{$rtmpUrl->id}/toggle");

    $response->assertForbidden();
    assertDatabaseHas('rtmp_urls', [
        'id' => $rtmpUrl->id,
        'is_active' => true,
    ]);
});
