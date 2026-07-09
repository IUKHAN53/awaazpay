<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\Shop;
use App\Models\StaffInvite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Onboards a phone. An owner registration creates the shop; a staff
 * registration joins an existing shop via a one-time invite code or the shop's
 * join code. Returns a device bearer token used for all subsequent calls.
 */
class RegisterController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role' => 'required|in:owner,staff',
            'name' => 'nullable|string|max:100',
            'shop_name' => 'nullable|string|max:120',
            'fcm_token' => 'nullable|string',
            'platform' => 'nullable|string|max:20',
            'invite_code' => 'nullable|string|max:12',
            'join_code' => 'nullable|string|max:12',
        ]);

        $shop = $data['role'] === 'owner'
            ? $this->createShop($data)
            : $this->resolveShopForStaff($data);

        $device = $shop->devices()->create([
            'name' => $data['name'] ?? ($data['role'] === 'owner' ? 'Owner' : 'Staff'),
            'role' => $data['role'],
            'platform' => $data['platform'] ?? 'android',
            'fcm_token' => $data['fcm_token'] ?? null,
            'api_token' => 'pending', // replaced by issueToken()
            'active' => true,
            'last_seen_at' => now(),
        ]);

        $token = $device->issueToken();

        // If joining via a one-time invite, mark it consumed.
        if ($data['role'] === 'staff' && ! empty($data['invite_code'])) {
            StaffInvite::where('shop_id', $shop->id)
                ->where('code', strtoupper($data['invite_code']))
                ->update(['status' => 'accepted', 'accepted_device_id' => $device->id]);
        }

        return response()->json([
            'device_token' => $token,
            'device' => [
                'id' => $device->id,
                'role' => $device->role,
                'name' => $device->name,
            ],
            'shop' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'join_code' => $shop->join_code,
            ],
        ], 201);
    }

    private function createShop(array $data): Shop
    {
        return Shop::create([
            'name' => $data['shop_name'] ?? 'My Shop',
            'join_code' => Shop::generateJoinCode(),
        ]);
    }

    private function resolveShopForStaff(array $data): Shop
    {
        // Prefer a one-time invite code; fall back to the shop's join code.
        if (! empty($data['invite_code'])) {
            $invite = StaffInvite::where('code', strtoupper($data['invite_code']))->first();
            if (! $invite || ! $invite->isRedeemable()) {
                throw ValidationException::withMessages([
                    'invite_code' => 'This invite code is invalid or has expired.',
                ]);
            }

            return $invite->shop;
        }

        if (! empty($data['join_code'])) {
            $shop = Shop::where('join_code', strtoupper($data['join_code']))->first();
            if (! $shop) {
                throw ValidationException::withMessages([
                    'join_code' => 'No shop found for this code.',
                ]);
            }

            return $shop;
        }

        throw ValidationException::withMessages([
            'invite_code' => 'An invite code or join code is required to join a shop.',
        ]);
    }
}
