<?php

namespace App\Filament\Widgets;

use App\Models\Device;
use App\Models\Payment;
use App\Models\Shop;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class PaymentStatsOverview extends StatsOverviewWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $todayTotal = (int) Payment::whereDate('received_at', today())->sum('amount');
        $todayCount = Payment::whereDate('received_at', today())->count();
        $weekTotal = (int) Payment::where('received_at', '>=', now()->subDays(6)->startOfDay())->sum('amount');

        // 7-day sparkline of daily volume for the "today" tile.
        $spark = collect(range(6, 0))
            ->map(fn ($d) => (int) Payment::whereDate('received_at', today()->subDays($d))->sum('amount'))
            ->all();

        return [
            Stat::make("Today's collection", 'Rs '.number_format($todayTotal))
                ->description($todayCount.' payment'.($todayCount === 1 ? '' : 's').' today')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success')
                ->chart($spark),

            Stat::make('This week', 'Rs '.number_format($weekTotal))
                ->description('Last 7 days')
                ->descriptionIcon('heroicon-m-calendar-days')
                ->color('warning'),

            Stat::make('Shops', (string) Shop::count())
                ->description(Device::count().' devices connected')
                ->descriptionIcon('heroicon-m-building-storefront')
                ->color('primary'),

            Stat::make('Staff devices', (string) Device::where('role', 'staff')->count())
                ->description(Device::where('role', 'owner')->count().' owner device(s)')
                ->descriptionIcon('heroicon-m-users')
                ->color('info'),
        ];
    }
}
