<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Services\WebhookVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_jazzcash_webhook_records_payment_and_maps_to_shop(): void
    {
        Http::fake(['fcm.googleapis.com/*' => Http::response(['success' => 1])]);
        config([
            'services.fcm.server_key' => 'test-key',
            'services.webhooks.jazzcash.salt' => 'SALT123',
        ]);

        $shop = Shop::create(['name' => 'Shop', 'join_code' => 'CODE01', 'merchant_ref' => 'MC12345']);
        $shop->devices()->create(['role' => 'owner', 'api_token' => 'x', 'fcm_token' => 'owner-tok', 'active' => true]);

        $params = [
            'pp_MerchantID' => 'MC12345',
            'pp_Amount' => '150000', // paisa → 1500 rupees
            'pp_TxnRefNo' => 'T123',
            'pp_CustomerMobile' => '03001234567',
        ];
        $params['pp_SecureHash'] = WebhookVerifier::jazzCashHash($params, 'SALT123');

        $res = $this->postJson('/api/webhooks/jazzcash', $params);

        $res->assertOk()->assertJsonPath('ok', true)->assertJsonPath('fanned_out', 1);
        $this->assertDatabaseHas('payments', [
            'shop_id' => $shop->id, 'amount' => 1500, 'txn_id' => 'T123', 'origin' => 'webhook',
        ]);
        $this->assertDatabaseHas('webhook_events', ['provider' => 'jazzcash', 'signature_valid' => true]);
    }

    public function test_invalid_signature_is_rejected_and_logged(): void
    {
        config(['services.webhooks.jazzcash.salt' => 'SALT123']);

        $res = $this->postJson('/api/webhooks/jazzcash', [
            'pp_MerchantID' => 'MC1', 'pp_Amount' => '100', 'pp_SecureHash' => 'WRONGHASH',
        ]);

        $res->assertStatus(401);
        $this->assertDatabaseHas('webhook_events', ['provider' => 'jazzcash', 'signature_valid' => false]);
        $this->assertSame(0, \App\Models\Payment::count());
    }

    public function test_unknown_provider_returns_404(): void
    {
        $this->postJson('/api/webhooks/bogus', [])->assertNotFound();
    }
}
