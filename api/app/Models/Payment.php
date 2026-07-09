<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id', 'device_id', 'source', 'payer', 'amount', 'txn_id', 'origin', 'received_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'received_at' => 'datetime',
        ];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /** Data payload pushed to devices so the native app can announce it. */
    public function toPushData(): array
    {
        return [
            'type' => 'payment',
            'id' => (string) $this->id,
            'source' => $this->source,
            'payer' => (string) ($this->payer ?? ''),
            'amount' => (string) $this->amount,
            'txn_id' => (string) ($this->txn_id ?? ''),
            'received_at' => (string) $this->received_at->getTimestampMs(),
        ];
    }
}
