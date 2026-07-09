<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $payments)
    {
    }

    /** Device uploads a payment it detected; backend fans it out to staff. */
    public function store(Request $request): JsonResponse
    {
        /** @var Device $device */
        $device = $request->attributes->get('device');

        $data = $request->validate([
            'source' => 'required|in:easypaisa,jazzcash,bank',
            'payer' => 'nullable|string|max:120',
            'amount' => 'required|integer|min:1',
            'txn_id' => 'nullable|string|max:120',
            'received_at' => 'nullable|date',
        ]);

        $result = $this->payments->record(
            $device->shop,
            [...$data, 'origin' => 'device'],
            originDeviceId: $device->id,
        );

        return response()->json([
            'id' => $result['payment']->id,
            'duplicate' => $result['duplicate'],
            'fanned_out' => $result['fanned_out'],
        ], $result['duplicate'] ? 200 : 201);
    }

    /** List payments for the shop, filtered by range/source. */
    public function index(Request $request): JsonResponse
    {
        $shop = $request->attributes->get('shop');

        $data = $request->validate([
            'range' => 'nullable|in:today,week,month,all',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'source' => 'nullable|in:easypaisa,jazzcash,bank',
        ]);

        [$from, $to] = $this->resolveRange($data);

        $query = $shop->payments()
            ->when($from, fn ($q) => $q->where('received_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('received_at', '<', $to))
            ->when($data['source'] ?? null, fn ($q, $s) => $q->where('source', $s))
            ->orderByDesc('received_at');

        $payments = $query->limit(500)->get();

        return response()->json([
            'total' => (int) $payments->sum('amount'),
            'count' => $payments->count(),
            'by_source' => $payments->groupBy('source')->map(fn ($g) => [
                'total' => (int) $g->sum('amount'),
                'count' => $g->count(),
            ]),
            'payments' => $payments->map(fn (Payment $p) => [
                'id' => $p->id,
                'source' => $p->source,
                'payer' => $p->payer,
                'amount' => $p->amount,
                'txn_id' => $p->txn_id,
                'origin' => $p->origin,
                'received_at' => $p->received_at->toIso8601String(),
            ]),
        ]);
    }

    /** Update this device's fcm token + presence. */
    public function heartbeat(Request $request): JsonResponse
    {
        /** @var Device $device */
        $device = $request->attributes->get('device');

        $data = $request->validate(['fcm_token' => 'nullable|string']);
        $device->forceFill([
            'fcm_token' => $data['fcm_token'] ?? $device->fcm_token,
            'last_seen_at' => now(),
        ])->save();

        return response()->json(['ok' => true]);
    }

    /**
     * @return array{0: ?Carbon, 1: ?Carbon}
     */
    private function resolveRange(array $data): array
    {
        if (! empty($data['from']) || ! empty($data['to'])) {
            return [
                ! empty($data['from']) ? Carbon::parse($data['from']) : null,
                ! empty($data['to']) ? Carbon::parse($data['to']) : null,
            ];
        }

        return match ($data['range'] ?? 'today') {
            'week' => [now()->startOfDay()->subDays(6), null],
            'month' => [now()->startOfDay()->subDays(29), null],
            'all' => [null, null],
            default => [now()->startOfDay(), null],
        };
    }
}
