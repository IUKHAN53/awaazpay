<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Models\WebhookEvent;
use App\Services\PaymentService;
use App\Services\WebhookVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Official IPN webhooks (JazzCash / Easypaisa). The signature is verified before
 * anything is trusted; every hit is logged to webhook_events. A verified payment
 * is recorded and fanned out to ALL of the shop's devices (no local device
 * detected it), so every phone announces.
 */
class WebhookController extends Controller
{
    public function __construct(
        private WebhookVerifier $verifier,
        private PaymentService $payments,
    ) {
    }

    public function handle(Request $request, string $provider): JsonResponse
    {
        if (! in_array($provider, ['jazzcash', 'easypaisa'], true)) {
            return response()->json(['message' => 'Unknown provider.'], 404);
        }

        $valid = $this->verifier->verify($provider, $request);

        $event = WebhookEvent::create([
            'provider' => $provider,
            'signature_valid' => $valid,
            'payload' => $request->all() ?: ['_raw' => $request->getContent()],
        ]);

        if (! $valid) {
            $event->update(['note' => 'Signature verification failed — rejected.']);

            return response()->json(['message' => 'Invalid signature.'], 401);
        }

        $normalized = $this->normalize($provider, $request);

        $shop = Shop::where('merchant_ref', $normalized['merchant_ref'])->first();
        if (! $shop) {
            $event->update(['note' => 'No shop mapped to merchant_ref '.$normalized['merchant_ref']]);

            return response()->json(['message' => 'Merchant not registered.'], 202);
        }

        $result = $this->payments->record($shop, [
            'source' => $provider,
            'payer' => $normalized['payer'],
            'amount' => $normalized['amount'],
            'txn_id' => $normalized['txn_id'],
            'origin' => 'webhook',
            'received_at' => now(),
        ]);

        $event->update([
            'shop_id' => $shop->id,
            'payment_id' => $result['payment']->id,
            'note' => $result['duplicate'] ? 'Duplicate txn — ignored.' : 'Recorded + fanned out.',
        ]);

        return response()->json([
            'ok' => true,
            'payment_id' => $result['payment']->id,
            'fanned_out' => $result['fanned_out'],
        ]);
    }

    /**
     * Map a provider payload onto our canonical fields. Field names must match
     * each provider's live IPN spec — adjust when integrating for real.
     *
     * @return array{merchant_ref:string, payer:?string, amount:int, txn_id:?string}
     */
    private function normalize(string $provider, Request $request): array
    {
        return match ($provider) {
            'jazzcash' => [
                'merchant_ref' => (string) $request->input('pp_MerchantID'),
                'payer' => $request->input('pp_CustomerMobile') ?: $request->input('ppmpf_1'),
                'amount' => (int) round(((float) $request->input('pp_Amount', 0)) / 100), // paisa → rupees
                'txn_id' => $request->input('pp_TxnRefNo'),
            ],
            'easypaisa' => [
                'merchant_ref' => (string) $request->input('storeId', $request->input('merchant_id')),
                'payer' => $request->input('msisdn'),
                'amount' => (int) round((float) $request->input('amount', 0)),
                'txn_id' => $request->input('transactionId', $request->input('orderId')),
            ],
            default => ['merchant_ref' => '', 'payer' => null, 'amount' => 0, 'txn_id' => null],
        };
    }
}
