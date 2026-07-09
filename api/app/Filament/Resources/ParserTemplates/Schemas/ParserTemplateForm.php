<?php

namespace App\Filament\Resources\ParserTemplates\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class ParserTemplateForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('platform')
                    ->required()
                    ->default('android'),
                TextInput::make('version')
                    ->required()
                    ->numeric(),
                Textarea::make('payload')
                    ->required()
                    ->columnSpanFull(),
                Toggle::make('active')
                    ->required(),
                TextInput::make('notes'),
            ]);
    }
}
