<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Shop;
use Illuminate\Support\Carbon;

class PaymentService
{
    public function __construct(private FcmService $fcm)
    {
    }

    /**
     * Record a payment for a shop and fan it out to the shop's other devices.
     *
     * @param  array{source:string,payer?:?string,amount:int,txn_id?:?string,received_at?:mixed,origin?:string}  $attrs
     * @param  int|null  $originDeviceId  the device that reported it (excluded from fan-out)
     * @return array{payment: Payment, duplicate: bool, fanned_out: int}
     */
    public function record(Shop $shop, array $attrs, ?int $originDeviceId = null): array
    {
        $txnId = $attrs['txn_id'] ?? null;

        // Cross-device dedupe on txn id.
        if ($txnId) {
            $existing = $shop->payments()->where('txn_id', $txnId)->first();
            if ($existing) {
                return ['payment' => $existing, 'duplicate' => true, 'fanned_out' => 0];
            }
        }

        $payment = $shop->payments()->create([
            'device_id' => $originDeviceId,
            'source' => $attrs['source'],
            'payer' => $attrs['payer'] ?? null,
            'amount' => $attrs['amount'],
            'txn_id' => $txnId,
            'origin' => $attrs['origin'] ?? 'device',
            'received_at' => isset($attrs['received_at'])
                ? Carbon::parse($attrs['received_at'])
                : now(),
        ]);

        // Fan out to the shop's other active devices so their phones announce.
        $devices = $shop->pushableDevices($originDeviceId)->get();
        $fannedOut = $this->fcm->sendToDevices($devices, $payment->toPushData());

        return ['payment' => $payment, 'duplicate' => false, 'fanned_out' => $fannedOut];
    }
}
