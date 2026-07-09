<?php

namespace App\Services;

use App\Models\Device;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends data-only push messages to devices so the native AwaazPay app can
 * announce a payment detected elsewhere (a staff member's phone, or an official
 * webhook). Uses the FCM legacy HTTP API keyed by services.fcm.server_key.
 *
 * If no key is configured the send is logged and skipped — the backend stays
 * fully runnable/testable without live FCM credentials. Swap in the HTTP v1 API
 * (service-account auth) for production hardening; the interface stays the same.
 */
class FcmService
{
    private const ENDPOINT = 'https://fcm.googleapis.com/fcm/send';

    /**
     * @param  Collection<int, Device>|array<int, Device>  $devices
     * @return int number of tokens the push was dispatched to
     */
    public function sendToDevices(iterable $devices, array $data): int
    {
        $tokens = collect($devices)
            ->pluck('fcm_token')
            ->filter()
            ->values();

        if ($tokens->isEmpty()) {
            return 0;
        }

        $key = config('services.fcm.server_key');
        if (! $key) {
            Log::info('FCM not configured — skipping push', [
                'tokens' => $tokens->count(),
                'data' => $data,
            ]);

            return 0;
        }

        // FCM legacy accepts up to 1000 registration_ids per request.
        foreach ($tokens->chunk(1000) as $chunk) {
            $response = Http::withHeaders([
                'Authorization' => 'key='.$key,
                'Content-Type' => 'application/json',
            ])->post(self::ENDPOINT, [
                'registration_ids' => $chunk->all(),
                'priority' => 'high',
                'data' => $data, // data-only → native handler announces even in background
            ]);

            if ($response->failed()) {
                Log::warning('FCM push failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        }

        return $tokens->count();
    }
}
