<?php

namespace Tests\Feature;

use App\Models\Device;
use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    private function shopWithOwner(): array
    {
        $shop = Shop::create(['name' => 'Shop', 'join_code' => 'CODE01']);
        $owner = $shop->devices()->create(['role' => 'owner', 'api_token' => 'x', 'fcm_token' => 'owner-tok', 'active' => true]);
        $token = $owner->issueToken();

        return [$shop, $owner, $token];
    }

    public function test_unauthenticated_payment_is_rejected(): void
    {
        $this->postJson('/api/payments', ['source' => 'easypaisa', 'amount' => 100])
            ->assertUnauthorized();
    }

    public function test_device_can_post_payment_and_it_fans_out_to_staff(): void
    {
        Http::fake(['fcm.googleapis.com/*' => Http::response(['success' => 1])]);
        config(['services.fcm.server_key' => 'test-key']);

        [$shop, $owner, $token] = $this->shopWithOwner();
        // Two staff devices with push tokens should each receive the fan-out.
        $shop->devices()->create(['role' => 'staff', 'api_token' => 'a', 'fcm_token' => 'staff-1', 'active' => true]);
        $shop->devices()->create(['role' => 'staff', 'api_token' => 'b', 'fcm_token' => 'staff-2', 'active' => true]);

        $res = $this->withToken($token)->postJson('/api/payments', [
            'source' => 'easypaisa',
            'payer' => 'Bilal Ahmed',
            'amount' => 1500,
            'txn_id' => 'TXN-1',
            'received_at' => now()->toIso8601String(),
        ]);

        $res->assertCreated()
            ->assertJsonPath('duplicate', false)
            ->assertJsonPath('fanned_out', 2); // both staff, not the origin owner

        $this->assertDatabaseHas('payments', ['shop_id' => $shop->id, 'amount' => 1500, 'origin' => 'device']);
    }

    public function test_duplicate_txn_is_not_stored_twice(): void
    {
        [$shop, $owner, $token] = $this->shopWithOwner();

        $payload = ['source' => 'jazzcash', 'amount' => 800, 'txn_id' => 'DUP-1'];
        $this->withToken($token)->postJson('/api/payments', $payload)->assertCreated();
        $this->withToken($token)->postJson('/api/payments', $payload)
            ->assertOk()
            ->assertJsonPath('duplicate', true);

        $this->assertSame(1, $shop->payments()->count());
    }

    public function test_index_returns_totals_by_source(): void
    {
        [$shop, $owner, $token] = $this->shopWithOwner();
        $shop->payments()->create(['source' => 'easypaisa', 'amount' => 1000, 'origin' => 'device', 'received_at' => now()]);
        $shop->payments()->create(['source' => 'easypaisa', 'amount' => 500, 'origin' => 'device', 'received_at' => now()]);
        $shop->payments()->create(['source' => 'jazzcash', 'amount' => 300, 'origin' => 'device', 'received_at' => now()]);

        $this->withToken($token)->getJson('/api/payments?range=today')
            ->assertOk()
            ->assertJsonPath('total', 1800)
            ->assertJsonPath('count', 3)
            ->assertJsonPath('by_source.easypaisa.total', 1500)
            ->assertJsonPath('by_source.jazzcash.count', 1);
    }
}
