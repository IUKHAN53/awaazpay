<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id', 'name', 'role', 'platform', 'fcm_token', 'api_token', 'active', 'last_seen_at',
    ];

    protected $hidden = ['api_token'];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'last_seen_at' => 'datetime',
        ];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    /**
     * Issue a fresh bearer token. Returns the PLAINTEXT token (shown once to the
     * device); only its sha256 hash is stored in api_token.
     */
    public function issueToken(): string
    {
        $plain = Str::random(48);
        $this->forceFill(['api_token' => hash('sha256', $plain)])->save();

        return $plain;
    }

    public static function findByToken(string $plain): ?self
    {
        return static::where('api_token', hash('sha256', $plain))->first();
    }
}
