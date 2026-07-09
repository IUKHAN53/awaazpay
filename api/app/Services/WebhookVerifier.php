<?php

namespace App\Services;

use Illuminate\Http\Request;

/**
 * Verifies inbound IPN webhooks are genuinely from the payment provider before
 * any payment is trusted. Secrets live in config/services.php (env), never in
 * code. Constant-time comparisons throughout.
 *
 * NOTE: the exact hashing differs per provider and must be confirmed against
 * their live integration docs + your assigned salt/secret. The two schemes here
 * cover the common cases:
 *   - JazzCash: HMAC-SHA256 over sorted, '&'-joined non-empty params, salted.
 *   - Easypaisa / generic: HMAC-SHA256 over the raw request body.
 */
class WebhookVerifier
{
    public function verify(string $provider, Request $request): bool
    {
        return match ($provider) {
            'jazzcash' => $this->verifyJazzCash($request),
            'easypaisa' => $this->verifyEasypaisa($request),
            default => false,
        };
    }

    private function verifyJazzCash(Request $request): bool
    {
        $salt = config('services.webhooks.jazzcash.salt');
        if (! $salt) {
            return false;
        }

        $received = (string) $request->input('pp_SecureHash');
        if ($received === '') {
            return false;
        }

        // Sort pp_* params (except the hash), keep non-empty, join values with '&'.
        $params = collect($request->all())
            ->filter(fn ($v, $k) => str_starts_with($k, 'pp_') && $k !== 'pp_SecureHash' && $v !== '' && $v !== null)
            ->sortKeys();

        $message = $salt.'&'.$params->values()->implode('&');
        $expected = strtoupper(hash_hmac('sha256', $message, $salt));

        return hash_equals($expected, strtoupper($received));
    }

    private function verifyEasypaisa(Request $request): bool
    {
        $secret = config('services.webhooks.easypaisa.secret');
        if (! $secret) {
            return false;
        }

        // Header name varies by integration; adjust to the assigned one.
        $received = (string) $request->header('X-Easypaisa-Signature', '');
        if ($received === '') {
            return false;
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, $received);
    }

    /** Helper for tests / tooling to produce a valid JazzCash hash. */
    public static function jazzCashHash(array $params, string $salt): string
    {
        $sorted = collect($params)
            ->filter(fn ($v, $k) => str_starts_with($k, 'pp_') && $k !== 'pp_SecureHash' && $v !== '' && $v !== null)
            ->sortKeys();

        $message = $salt.'&'.$sorted->values()->implode('&');

        return strtoupper(hash_hmac('sha256', $message, $salt));
    }
}
