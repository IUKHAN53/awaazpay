<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParserTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Serves the active parser template. The app sends the version it currently has;
 * we return the payload only if a newer one is active (so the app can hot-update
 * its wallet-parsing rules without a store release).
 */
class TemplateController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $data = $request->validate([
            'platform' => 'nullable|string|max:20',
            'version' => 'nullable|integer|min:0',
        ]);

        $platform = $data['platform'] ?? 'android';
        $have = $data['version'] ?? 0;

        $template = ParserTemplate::active($platform);

        if (! $template) {
            return response()->json(['updated' => false]);
        }

        if ($template->version <= $have) {
            return response()->json([
                'updated' => false,
                'version' => $template->version,
            ]);
        }

        return response()->json([
            'updated' => true,
            'version' => $template->version,
            'payload' => $template->payload,
        ]);
    }
}
