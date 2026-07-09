<?php

namespace Tests\Feature;

use App\Models\ParserTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TemplateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\ParserTemplateSeeder::class);
    }

    public function test_returns_payload_when_app_version_is_older(): void
    {
        $this->getJson('/api/templates?platform=android&version=0')
            ->assertOk()
            ->assertJsonPath('updated', true)
            ->assertJsonPath('version', 1)
            ->assertJsonStructure(['payload']);
    }

    public function test_returns_not_updated_when_app_is_current(): void
    {
        $this->getJson('/api/templates?platform=android&version=1')
            ->assertOk()
            ->assertJsonPath('updated', false);
    }

    public function test_serves_newest_active_version(): void
    {
        ParserTemplate::create(['platform' => 'android', 'version' => 2, 'payload' => [['source' => 'easypaisa']], 'active' => true]);

        $this->getJson('/api/templates?version=1')
            ->assertOk()
            ->assertJsonPath('updated', true)
            ->assertJsonPath('version', 2);
    }
}
