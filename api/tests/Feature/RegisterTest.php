<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\StaffInvite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_registration_creates_shop_and_returns_token(): void
    {
        $res = $this->postJson('/api/register', [
            'role' => 'owner',
            'shop_name' => 'Bilal Store',
            'fcm_token' => 'tok-owner',
        ]);

        $res->assertCreated()
            ->assertJsonStructure(['device_token', 'device' => ['id', 'role'], 'shop' => ['id', 'name', 'join_code']])
            ->assertJsonPath('device.role', 'owner')
            ->assertJsonPath('shop.name', 'Bilal Store');

        $this->assertDatabaseHas('shops', ['name' => 'Bilal Store']);
        $this->assertDatabaseHas('devices', ['role' => 'owner', 'fcm_token' => 'tok-owner']);
    }

    public function test_staff_can_join_via_invite_code(): void
    {
        $shop = Shop::create(['name' => 'Shop', 'join_code' => 'ABC123']);
        $invite = $shop->invites()->create([
            'code' => 'INVITE99', 'status' => 'pending', 'expires_at' => now()->addDay(),
        ]);

        $res = $this->postJson('/api/register', [
            'role' => 'staff',
            'name' => 'Sana',
            'invite_code' => 'invite99', // case-insensitive
            'fcm_token' => 'tok-staff',
        ]);

        $res->assertCreated()->assertJsonPath('shop.id', $shop->id);
        $this->assertDatabaseHas('devices', ['shop_id' => $shop->id, 'role' => 'staff', 'name' => 'Sana']);
        $this->assertDatabaseHas('staff_invites', ['id' => $invite->id, 'status' => 'accepted']);
    }

    public function test_staff_can_join_via_join_code(): void
    {
        $shop = Shop::create(['name' => 'Shop', 'join_code' => 'JOIN42']);

        $this->postJson('/api/register', ['role' => 'staff', 'join_code' => 'join42'])
            ->assertCreated()
            ->assertJsonPath('shop.id', $shop->id);
    }

    public function test_invalid_invite_is_rejected(): void
    {
        $this->postJson('/api/register', ['role' => 'staff', 'invite_code' => 'NOPE'])
            ->assertStatus(422);
    }
}
