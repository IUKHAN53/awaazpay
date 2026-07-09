<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\StaffInvite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Owner-only staff management: mint one-time invite codes, list the shop's
 * devices, and remove a staff device (revoking its access + push).
 */
class StaffController extends Controller
{
    public function createInvite(Request $request): JsonResponse
    {
        $this->ownerOnly($request);
        $shop = $request->attributes->get('shop');

        $data = $request->validate(['phone' => 'nullable|string|max:20']);

        $invite = $shop->invites()->create([
            'code' => StaffInvite::generateCode(),
            'phone' => $data['phone'] ?? null,
            'status' => 'pending',
            'expires_at' => now()->addDay(),
        ]);

        return response()->json([
            'code' => $invite->code,
            'expires_at' => $invite->expires_at->toIso8601String(),
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $this->ownerOnly($request);
        $shop = $request->attributes->get('shop');

        return response()->json([
            'devices' => $shop->devices()->orderBy('role')->get()->map(fn (Device $d) => [
                'id' => $d->id,
                'name' => $d->name,
                'role' => $d->role,
                'active' => $d->active,
                'last_seen_at' => $d->last_seen_at?->toIso8601String(),
            ]),
        ]);
    }

    public function destroy(Request $request, Device $device): JsonResponse
    {
        $this->ownerOnly($request);
        $shop = $request->attributes->get('shop');

        abort_unless($device->shop_id === $shop->id, 404);
        abort_if($device->isOwner(), 403, 'Cannot remove the owner device.');

        $device->delete();

        return response()->json(['ok' => true]);
    }

    private function ownerOnly(Request $request): void
    {
        /** @var Device $device */
        $device = $request->attributes->get('device');
        abort_unless($device->isOwner(), 403, 'Owner only.');
    }
}
