<?php

namespace App\Filament\Resources\StaffInvites;

use App\Filament\Resources\StaffInvites\Pages\CreateStaffInvite;
use App\Filament\Resources\StaffInvites\Pages\EditStaffInvite;
use App\Filament\Resources\StaffInvites\Pages\ListStaffInvites;
use App\Filament\Resources\StaffInvites\Schemas\StaffInviteForm;
use App\Filament\Resources\StaffInvites\Tables\StaffInvitesTable;
use App\Models\StaffInvite;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class StaffInviteResource extends Resource
{
    protected static ?string $model = StaffInvite::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return StaffInviteForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return StaffInvitesTable::configure($table);
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
            'index' => ListStaffInvites::route('/'),
            'create' => CreateStaffInvite::route('/create'),
            'edit' => EditStaffInvite::route('/{record}/edit'),
        ];
    }
}
