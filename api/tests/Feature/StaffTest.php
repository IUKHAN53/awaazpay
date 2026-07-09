<?php

namespace Tests\Feature;

use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffTest extends TestCase
{
    use RefreshDatabase;

    private function shop(): Shop
    {
        return Shop::create(['name' => 'Shop', 'join_code' => 'CODE01']);
    }

    private function tokenFor(Shop $shop, string $role): string
    {
        $device = $shop->devices()->create(['role' => $role, 'api_token' => 'x'.$role, 'active' => true]);

        return $device->issueToken();
    }

    public function test_owner_can_create_invite(): void
    {
        $shop = $this->shop();
        $token = $this->tokenFor($shop, 'owner');

        $this->withToken($token)->postJson('/api/staff/invites', ['phone' => '03001234567'])
            ->assertCreated()
            ->assertJsonStructure(['code', 'expires_at']);

        $this->assertDatabaseHas('staff_invites', ['shop_id' => $shop->id, 'status' => 'pending']);
    }

    public function test_staff_cannot_create_invite(): void
    {
        $shop = $this->shop();
        $token = $this->tokenFor($shop, 'staff');

        $this->withToken($token)->postJson('/api/staff/invites')->assertForbidden();
    }

    public function test_owner_can_list_and_remove_staff(): void
    {
        $shop = $this->shop();
        $ownerToken = $this->tokenFor($shop, 'owner');
        $staff = $shop->devices()->create(['role' => 'staff', 'api_token' => 'stafftok', 'active' => true]);

        $this->withToken($ownerToken)->getJson('/api/staff')
            ->assertOk()
            ->assertJsonCount(2, 'devices');

        $this->withToken($ownerToken)->deleteJson("/api/staff/{$staff->id}")->assertOk();
        $this->assertDatabaseMissing('devices', ['id' => $staff->id]);
    }

    public function test_cannot_remove_owner_device(): void
    {
        $shop = $this->shop();
        $ownerToken = $this->tokenFor($shop, 'owner');
        $ownerDevice = $shop->devices()->where('role', 'owner')->first();

        $this->withToken($ownerToken)->deleteJson("/api/staff/{$ownerDevice->id}")->assertForbidden();
    }
}
