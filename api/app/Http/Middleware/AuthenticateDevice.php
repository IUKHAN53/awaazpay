<?php

namespace App\Http\Middleware;

use App\Models\Device;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates API calls by a device bearer token (sha256-hashed in the DB).
 * On success, binds the Device (and its Shop) to the request so controllers
 * can scope everything to that shop. Also refreshes last_seen_at.
 */
class AuthenticateDevice
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token || ! ($device = Device::findByToken($token)) || ! $device->active) {
            return response()->json(['message' => 'Unauthenticated device.'], 401);
        }

        $device->forceFill(['last_seen_at' => now()])->save();

        $request->setUserResolver(fn () => $device);
        $request->attributes->set('device', $device);
        $request->attributes->set('shop', $device->shop);

        return $next($request);
    }
}
