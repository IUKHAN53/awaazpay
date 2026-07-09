<?php

use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\WebhookController;
use Illuminate\Support\Facades\Route;

/*
| AwaazPay API
|   Public:  device onboarding, parser templates, provider IPN webhooks.
|   Device:  authenticated by the bearer token issued at registration.
*/

// --- Public ---
Route::post('register', [RegisterController::class, 'store']);
Route::get('templates', [TemplateController::class, 'show']);
Route::post('webhooks/{provider}', [WebhookController::class, 'handle']);

// --- Authenticated device ---
Route::middleware('auth.device')->group(function () {
    Route::post('payments', [PaymentController::class, 'store']);
    Route::get('payments', [PaymentController::class, 'index']);
    Route::post('heartbeat', [PaymentController::class, 'heartbeat']);

    Route::get('staff', [StaffController::class, 'index']);
    Route::post('staff/invites', [StaffController::class, 'createInvite']);
    Route::delete('staff/{device}', [StaffController::class, 'destroy']);
});
