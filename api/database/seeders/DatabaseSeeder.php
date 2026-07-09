<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(ParserTemplateSeeder::class);

        // Admin login for the Filament panel (change the password in prod).
        User::firstOrCreate(
            ['email' => 'admin@awaazpay.pk'],
            ['name' => 'AwaazPay Admin', 'password' => bcrypt('password')],
        );
    }
}
