<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * The scoring engine is duplicated: once in the web portal script and once in
 * the Expo app. Any nutrient a medication can deplete MUST have both a
 * supplement and a lab entry in BOTH copies — otherwise the user is shown
 * "High depletion" with no advice and reasonably concludes the app is broken.
 *
 * This guards the fix for that gap (Zinc, Iron, Selenium, Melatonin, Vitamin K
 * were all scoreable but unadvised) and, just as importantly, stops the two
 * engines drifting apart again.
 */
class NutrientCoverageTest extends TestCase
{
    private const WEB_ENGINE = 'resources/views/include/script.blade.php';

    private const MOBILE_DATA = 'mobile/src/content/wizardData.ts';

    private const SEEDER = 'database/seeders/MedicationSeeder.php';

    /** Every nutrient any medication in the catalog claims to deplete. */
    private function scoredNutrients(): array
    {
        $src = file_get_contents(base_path(self::SEEDER));

        preg_match_all("/'nutrient'\s*=>\s*'([^']+)'/", $src, $m);

        $nutrients = array_values(array_unique($m[1]));
        sort($nutrients);

        return $nutrients;
    }

    /** Keys of a `NAME = { ... };` map in a JS/TS source file. */
    private function mapKeys(string $relativePath, string $mapName): array
    {
        $src = file_get_contents(base_path($relativePath));

        $ok = preg_match('/'.preg_quote($mapName, '/').'[^{]*\{(.*?)\n\};/s', $src, $block);
        $this->assertSame(1, $ok, "Could not locate {$mapName} in {$relativePath}");

        preg_match_all('/^\s*[\'"]?([A-Za-z0-9 ]+?)[\'"]?\s*:\s*\[/m', $block[1], $m);

        $keys = array_values(array_unique($m[1]));
        sort($keys);

        return $keys;
    }

    public function test_the_catalog_defines_the_expected_nutrient_set(): void
    {
        // Pins the canonical list so a new medication introducing a new
        // nutrient fails loudly here rather than silently shipping no advice.
        $this->assertSame([
            'B vitamins',
            'Calcium',
            'CoQ10',
            'Iron',
            'Magnesium',
            'Melatonin',
            'Potassium',
            'Selenium',
            'Vitamin B12',
            'Vitamin D',
            'Vitamin K',
            'Zinc',
        ], $this->scoredNutrients());
    }

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function engineProvider(): array
    {
        return [
            'web supplements' => [self::WEB_ENGINE, 'SUPPLEMENT_MAP'],
            'web labs' => [self::WEB_ENGINE, 'LAB_SUGGESTIONS'],
            'mobile supplements' => [self::MOBILE_DATA, 'SUPPLEMENT_MAP'],
            'mobile labs' => [self::MOBILE_DATA, 'LAB_SUGGESTIONS'],
        ];
    }

    #[DataProvider('engineProvider')]
    public function test_every_scored_nutrient_has_advice(string $path, string $map): void
    {
        $missing = array_diff($this->scoredNutrients(), $this->mapKeys($path, $map));

        $this->assertSame(
            [],
            array_values($missing),
            "{$map} in {$path} is missing entries for: ".implode(', ', $missing).
            ' — these nutrients can score High yet return no advice.',
        );
    }

    public function test_web_and_mobile_engines_stay_in_lockstep(): void
    {
        $this->assertSame(
            $this->mapKeys(self::WEB_ENGINE, 'SUPPLEMENT_MAP'),
            $this->mapKeys(self::MOBILE_DATA, 'SUPPLEMENT_MAP'),
            'Supplement maps have drifted between the web and mobile engines.',
        );

        $this->assertSame(
            $this->mapKeys(self::WEB_ENGINE, 'LAB_SUGGESTIONS'),
            $this->mapKeys(self::MOBILE_DATA, 'LAB_SUGGESTIONS'),
            'Lab suggestion maps have drifted between the web and mobile engines.',
        );
    }

    public function test_vitamin_k_advice_does_not_tell_anticoagulated_users_to_supplement(): void
    {
        // Warfarin is the ONLY medication that depletes vitamin K, and it works
        // by blocking vitamin K recycling — so recommending a K2 supplement
        // here would work against the user's own anticoagulation.
        foreach ([self::WEB_ENGINE, self::MOBILE_DATA] as $path) {
            $src = file_get_contents(base_path($path));

            preg_match('/[\'"]?Vitamin K[\'"]?\s*:\s*\[([^\]]*)\]/', $src, $m);
            $advice = strtolower($m[1] ?? '');

            $this->assertStringNotContainsString('mk-7', $advice, "Unsafe vitamin K advice in {$path}");
            $this->assertStringContainsString('steady', $advice, "Vitamin K advice in {$path} should counsel stable intake");
        }
    }

    public function test_anticoagulant_review_covers_vitamin_k_on_both_platforms(): void
    {
        foreach ([self::WEB_ENGINE, 'mobile/src/wizard/engine.ts'] as $path) {
            $src = file_get_contents(base_path($path));

            $this->assertMatchesRegularExpression(
                '/ANTICOAG_REVIEW_NUTRIENTS\s*=\s*\[[^\]]*[\'"]vitamin k[\'"]/i',
                $src,
                "Anticoagulant contraindication in {$path} does not cover vitamin K.",
            );
        }
    }
}
