<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Shop extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'owner_phone', 'join_code', 'merchant_ref'];

    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function invites(): HasMany
    {
        return $this->hasMany(StaffInvite::class);
    }

    /** Active devices that can receive a push, optionally excluding one device. */
    public function pushableDevices(?int $exceptDeviceId = null): HasMany
    {
        return $this->devices()
            ->where('active', true)
            ->whereNotNull('fcm_token')
            ->when($exceptDeviceId, fn ($q) => $q->where('id', '!=', $exceptDeviceId));
    }

    public static function generateJoinCode(): string
    {
        do {
            $code = strtoupper(Str::random(6));
        } while (static::where('join_code', $code)->exists());

        return $code;
    }
}
