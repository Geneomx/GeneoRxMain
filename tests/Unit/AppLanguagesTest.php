<?php

namespace Tests\Unit;

use App\Support\AppLanguages;
use Tests\TestCase;

/**
 * Language gating: incomplete languages (ar/ur/sw) must be kept out of the
 * pickers, while a language with no explicit flag stays enabled so older
 * config keeps working.
 */
class AppLanguagesTest extends TestCase
{
    public function test_gated_languages_are_excluded_from_enabled(): void
    {
        $enabled = array_column(AppLanguages::enabled(), 'code');

        $this->assertContains('en', $enabled);
        $this->assertContains('es', $enabled);
        $this->assertContains('fr', $enabled);

        $this->assertNotContains('ar', $enabled);
        $this->assertNotContains('ur', $enabled);
        $this->assertNotContains('sw', $enabled);
    }

    public function test_all_still_returns_every_language(): void
    {
        // Gating hides languages from users, but the full list must remain
        // available (translation tooling, admin, the export script).
        $all = array_column(AppLanguages::all(), 'code');

        foreach (['en', 'es', 'fr', 'ar', 'ur', 'sw'] as $code) {
            $this->assertContains($code, $all);
        }
    }

    public function test_is_enabled_reports_correctly(): void
    {
        $this->assertTrue(AppLanguages::isEnabled('en'));
        $this->assertFalse(AppLanguages::isEnabled('ar'));
        $this->assertFalse(AppLanguages::isEnabled('nonsense'));
        $this->assertFalse(AppLanguages::isEnabled(null));
    }

    public function test_a_language_without_an_explicit_flag_defaults_to_enabled(): void
    {
        config(['languages' => [
            ['code' => 'en', 'label' => 'English', 'native_label' => 'English', 'web_path' => ''],
            ['code' => 'zz', 'label' => 'Test', 'native_label' => 'Test', 'web_path' => '/zz'],
        ]]);

        $this->assertTrue(AppLanguages::isEnabled('zz'));
    }
}
