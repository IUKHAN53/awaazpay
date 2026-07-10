<?php

namespace App\Filament\Widgets;

use App\Models\Payment;
use Filament\Widgets\ChartWidget;

class SourceBreakdownChart extends ChartWidget
{
    protected ?string $heading = 'By payment source';

    protected static ?int $sort = 3;

    protected function getData(): array
    {
        $sources = [
            'easypaisa' => ['Easypaisa', '#1e7f4f'],
            'jazzcash' => ['JazzCash', '#c0392b'],
            'bank' => ['Bank', '#2f5fb3'],
        ];

        $labels = [];
        $data = [];
        $colors = [];

        foreach ($sources as $key => [$label, $color]) {
            $labels[] = $label;
            $data[] = (int) Payment::where('source', $key)->sum('amount');
            $colors[] = $color;
        }

        return [
            'datasets' => [
                [
                    'label' => 'Rs',
                    'data' => $data,
                    'backgroundColor' => $colors,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
    }
}
