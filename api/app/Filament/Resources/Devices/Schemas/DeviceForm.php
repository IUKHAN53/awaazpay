<?php

namespace App\Filament\Resources\Devices\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class DeviceForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('shop_id')
                    ->relationship('shop', 'name')
                    ->required(),
                TextInput::make('name'),
                TextInput::make('role')
                    ->required()
                    ->default('staff'),
                TextInput::make('platform')
                    ->required()
                    ->default('android'),
                Toggle::make('active')
                    ->required(),
                DateTimePicker::make('last_seen_at'),
            ]);
    }
}
