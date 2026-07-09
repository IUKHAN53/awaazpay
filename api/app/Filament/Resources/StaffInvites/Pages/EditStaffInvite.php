<?php

namespace App\Filament\Resources\StaffInvites\Pages;

use App\Filament\Resources\StaffInvites\StaffInviteResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditStaffInvite extends EditRecord
{
    protected static string $resource = StaffInviteResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
