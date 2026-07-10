<?php

namespace App\Filament\Widgets;

use App\Models\Payment;
use Filament\Widgets\ChartWidget;

class DailyPaymentsChart extends ChartWidget
{
    protected ?string $heading = 'Payments — last 14 days';

    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 'full';

    protected function getData(): array
    {
        $days = collect(range(13, 0))->map(fn ($d) => now()->subDays($d)->startOfDay());

        $totals = $days->map(fn ($d) => (int) Payment::whereDate('received_at', $d)->sum('amount'));

        return [
            'datasets' => [
                [
                    'label' => 'Rs received',
                    'data' => $totals->all(),
                    'backgroundColor' => '#f0b429',
                    'borderColor' => '#c98f10',
                    'borderRadius' => 6,
                ],
            ],
            'labels' => $days->map(fn ($d) => $d->format('D j'))->all(),
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}
