<?php

namespace Database\Seeders;

use App\Models\ParserTemplate;
use Illuminate\Database\Seeder;

/**
 * Seeds parser template v1 for Android — the same source/package/sender/regex
 * rules bundled in the app, now served so they can be updated without a release.
 * Bump `version` and set active when wallet wording changes.
 */
class ParserTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $payload = [
            [
                'source' => 'easypaisa',
                'packages' => ['pk.com.telenor.phoenix'],
                'senders' => ['Easypaisa', '3737'],
                'patterns' => [
                    ['regex' => '(?:received|receive)\\s+(?:Rs|PKR)\\.?\\s*([\\d,]+)(?:\\.\\d+)?\\s+from\\s+([A-Za-z\\x{0600}-\\x{06FF} ]+?)(?:\\.|,|$)', 'amountGroup' => 1, 'payerGroup' => 2],
                    ['regex' => '(?:Rs|PKR)\\.?\\s*([\\d,]+)(?:\\.\\d+)?\\s+(?:received|credited)', 'amountGroup' => 1, 'payerGroup' => 0],
                ],
            ],
            [
                'source' => 'jazzcash',
                'packages' => ['com.techlogix.mobilinkcustomer', 'com.jazzcash.consumer'],
                'senders' => ['JazzCash', '8558'],
                'patterns' => [
                    ['regex' => '(?:received|receive)\\s+(?:Rs|PKR)\\.?\\s*([\\d,]+)(?:\\.\\d+)?\\s+from\\s+([A-Za-z\\x{0600}-\\x{06FF} ]+?)(?:\\.|,|$)', 'amountGroup' => 1, 'payerGroup' => 2],
                    ['regex' => '(?:Rs|PKR)\\.?\\s*([\\d,]+)(?:\\.\\d+)?\\s+(?:received|credited)', 'amountGroup' => 1, 'payerGroup' => 0],
                ],
            ],
            [
                'source' => 'bank',
                'packages' => [],
                'senders' => ['Meezan Bank', '8079', 'HBL', '4250'],
                'patterns' => [
                    ['regex' => '(?:credited|received).{0,40}?(?:Rs|PKR)\\.?\\s*([\\d,]+)(?:\\.\\d+)?', 'amountGroup' => 1, 'payerGroup' => 0],
                    ['regex' => '(?:Rs|PKR)\\.?\\s*([\\d,]+)(?:\\.\\d+)?.{0,40}?credited', 'amountGroup' => 1, 'payerGroup' => 0],
                ],
            ],
        ];

        ParserTemplate::updateOrCreate(
            ['platform' => 'android', 'version' => 1],
            ['payload' => $payload, 'active' => true, 'notes' => 'Initial bundled rules'],
        );
    }
}
