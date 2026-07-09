<?php

namespace App\Filament\Resources\Shops\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class ShopForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('owner_phone')
                    ->tel(),
                TextInput::make('join_code')
                    ->required(),
                TextInput::make('merchant_ref'),
            ]);
    }
}
