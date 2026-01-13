<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RtmpUrl>
 */
class RtmpUrlFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $platforms = ['YouTube', 'Twitch', 'Facebook', 'Instagram', 'TikTok'];
        $platform = fake()->randomElement($platforms);

        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true) . ' Stream',
            'url' => 'rtmp://' . fake()->domainName() . '/live/' . fake()->uuid(),
            'platform' => $platform,
            'is_active' => fake()->boolean(80),
        ];
    }

    /**
     * Indicate that the RTMP URL is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the RTMP URL is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}

