<?php

namespace App\Filament\Resources\ParserTemplates\Pages;

use App\Filament\Resources\ParserTemplates\ParserTemplateResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListParserTemplates extends ListRecords
{
    protected static string $resource = ParserTemplateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
