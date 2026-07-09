<?php

namespace App\Filament\Resources\ParserTemplates;

use App\Filament\Resources\ParserTemplates\Pages\CreateParserTemplate;
use App\Filament\Resources\ParserTemplates\Pages\EditParserTemplate;
use App\Filament\Resources\ParserTemplates\Pages\ListParserTemplates;
use App\Filament\Resources\ParserTemplates\Schemas\ParserTemplateForm;
use App\Filament\Resources\ParserTemplates\Tables\ParserTemplatesTable;
use App\Models\ParserTemplate;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class ParserTemplateResource extends Resource
{
    protected static ?string $model = ParserTemplate::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return ParserTemplateForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ParserTemplatesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListParserTemplates::route('/'),
            'create' => CreateParserTemplate::route('/create'),
            'edit' => EditParserTemplate::route('/{record}/edit'),
        ];
    }
}
