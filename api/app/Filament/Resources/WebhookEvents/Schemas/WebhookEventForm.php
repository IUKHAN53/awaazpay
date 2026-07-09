<?php

namespace App\Filament\Resources\WebhookEvents\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class WebhookEventForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('provider')
                    ->required(),
                Toggle::make('signature_valid')
                    ->required(),
                Select::make('shop_id')
                    ->relationship('shop', 'name'),
                Select::make('payment_id')
                    ->relationship('payment', 'id'),
                Textarea::make('payload')
                    ->columnSpanFull(),
                TextInput::make('note'),
            ]);
    }
}
