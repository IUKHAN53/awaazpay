<?php

namespace App\Filament\Resources\StaffInvites\Pages;

use App\Filament\Resources\StaffInvites\StaffInviteResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListStaffInvites extends ListRecords
{
    protected static string $resource = StaffInviteResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
