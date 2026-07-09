<?php

namespace App\Filament\Resources\Payments\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class PaymentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('shop_id')
                    ->relationship('shop', 'name')
                    ->required(),
                Select::make('device_id')
                    ->relationship('device', 'name'),
                TextInput::make('source')
                    ->required(),
                TextInput::make('payer'),
                TextInput::make('amount')
                    ->required()
                    ->numeric(),
                TextInput::make('txn_id'),
                TextInput::make('origin')
                    ->required()
                    ->default('device'),
                DateTimePicker::make('received_at')
                    ->required(),
            ]);
    }
}
