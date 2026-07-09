<?php

namespace App\Filament\Resources\ParserTemplates\Pages;

use App\Filament\Resources\ParserTemplates\ParserTemplateResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditParserTemplate extends EditRecord
{
    protected static string $resource = ParserTemplateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
