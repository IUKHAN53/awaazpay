<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParserTemplate extends Model
{
    protected $fillable = ['platform', 'version', 'payload', 'active', 'notes'];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'active' => 'boolean',
            'version' => 'integer',
        ];
    }

    public static function active(string $platform = 'android'): ?self
    {
        return static::where('platform', $platform)
            ->where('active', true)
            ->orderByDesc('version')
            ->first();
    }
}
