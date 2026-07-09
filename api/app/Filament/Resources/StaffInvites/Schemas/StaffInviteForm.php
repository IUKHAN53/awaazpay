<?php

namespace App\Filament\Resources\StaffInvites\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class StaffInviteForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('shop_id')
                    ->relationship('shop', 'name')
                    ->required(),
                TextInput::make('code')
                    ->required(),
                TextInput::make('phone')
                    ->tel(),
                TextInput::make('status')
                    ->required()
                    ->default('pending'),
                TextInput::make('accepted_device_id')
                    ->numeric(),
                DateTimePicker::make('expires_at'),
            ]);
    }
}
