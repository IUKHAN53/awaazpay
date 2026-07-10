<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Shop;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Sample data so the dashboard widgets/charts have something to show.
 * OPT-IN only (not in DatabaseSeeder). Run: php artisan db:seed --class=DemoSeeder
 * Clear it with: php artisan migrate:fresh --seed
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Shop::firstOrCreate(
            ['join_code' => 'DEMO01'],
            ['name' => 'Bilal Kiryana Store', 'owner_phone' => '03001234567']
        );

        $owner = $shop->devices()->firstOrCreate(
            ['role' => 'owner'],
            ['name' => 'Owner', 'api_token' => hash('sha256', 'demo-owner'), 'fcm_token' => 'demo-owner-fcm', 'active' => true, 'last_seen_at' => now()]
        );
        $shop->devices()->firstOrCreate(
            ['name' => 'Sana (staff)'],
            ['role' => 'staff', 'api_token' => hash('sha256', 'demo-staff'), 'fcm_token' => 'demo-staff-fcm', 'active' => true, 'last_seen_at' => now()]
        );

        $payers = ['Bilal Ahmed', 'Sana Tariq', 'Raheel Khan', 'Adnan Qureshi', 'Ayesha Malik', 'Usman Ali', 'Meezan transfer', 'HBL transfer'];
        // Weighted toward Easypaisa, then JazzCash, then bank.
        $sources = array_merge(array_fill(0, 5, 'easypaisa'), array_fill(0, 3, 'jazzcash'), array_fill(0, 2, 'bank'));
        $amounts = [150, 250, 400, 500, 850, 1200, 1500, 2000, 2500, 3500, 5000];

        for ($day = 13; $day >= 0; $day--) {
            $count = random_int(2, 7); // payments that day
            for ($i = 0; $i < $count; $i++) {
                $when = Carbon::today()->subDays($day)
                    ->addHours(random_int(9, 21))
                    ->addMinutes(random_int(0, 59));
                $shop->payments()->create([
                    'device_id' => $owner->id,
                    'source' => $sources[array_rand($sources)],
                    'payer' => $payers[array_rand($payers)],
                    'amount' => $amounts[array_rand($amounts)],
                    'txn_id' => 'DEMO-'.$day.'-'.$i,
                    'origin' => 'device',
                    'received_at' => $when,
                ]);
            }
        }

        $this->command?->info('DemoSeeder: '.Payment::count().' payments across 14 days.');
    }
}
