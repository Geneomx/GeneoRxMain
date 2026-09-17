<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * The scoring engine is duplicated by hand: mobile/src/wizard/engine.ts and
 * resources/views/include/script.blade.php. Nothing but code review has ever
 * enforced that they agree, which is how the five parity defects in a56723b
 * reached production — both platforms were individually self-consistent, so
 * neither the typechecker nor the test suite could see the divergence.
 *
 * This asserts the shared CONSTANTS are identical. It needs no JS runtime: it
 * regex-extracts the values from both files and compares them. A transposed
 * weight on one platform now fails CI instead of silently giving the same
 * patient a different score depending on which device they opened.
 */
class EngineParityTest extends TestCase
{
    /**
     * Both files, concatenated: the shared key lists are declared in types.ts
     * and imported by engine.ts, while the weights live in engine.ts.
     */
    private function mobileSource(): string
    {
        return file_get_contents(base_path('mobile/src/wizard/engine.ts'))
            ."\n"
            .file_get_contents(base_path('mobile/src/wizard/types.ts'));
    }

    private function webSource(): string
    {
        return file_get_contents(resource_path('views/include/script.blade.php'));
    }

    /** Pull a list of quoted strings out of an array literal. */
    private function extractStringList(string $source, string $name): array
    {
        $this->assertMatchesRegularExpression(
            '/'.preg_quote($name, '/').'\s*=\s*\[/',
            $source,
            "Could not find {$name} — did it get renamed?"
        );

        preg_match('/'.preg_quote($name, '/').'\s*=\s*\[(.*?)\]/s', $source, $m);
        preg_match_all('/[\'"]([a-z_]+)[\'"]/i', $m[1], $items);

        return $items[1];
    }

    /** Pull `key: 0.35` pairs out of an object literal. */
    private function extractWeights(string $source): array
    {
        preg_match('/MCS_WEIGHTS[^=]*=\s*\{(.*?)\}/s', $source, $m);
        $this->assertNotEmpty($m, 'Could not find MCS_WEIGHTS');

        preg_match_all('/([a-z]+)\s*:\s*([0-9.]+)/i', $m[1], $pairs, PREG_SET_ORDER);

        $out = [];
        foreach ($pairs as $p) {
            $out[$p[1]] = (float) $p[2];
        }
        ksort($out);

        return $out;
    }

    public function test_body_system_keys_match_across_platforms(): void
    {
        $mobile = $this->extractStringList($this->mobileSource(), 'BODY_SYSTEM_KEYS');
        $web = $this->extractStringList($this->webSource(), 'BODY_SYSTEM_KEYS');

        $this->assertSame(
            $mobile,
            $web,
            'BODY_SYSTEM_KEYS differ. Order matters — it is the display order of the Body Systems view.'
        );
        $this->assertCount(7, $mobile);
    }

    public function test_lifestyle_keys_match_across_platforms(): void
    {
        $this->assertSame(
            $this->extractStringList($this->mobileSource(), 'LIFESTYLE_KEYS'),
            $this->extractStringList($this->webSource(), 'LIFESTYLE_KEYS'),
            'LIFESTYLE_KEYS differ between mobile and web.'
        );
    }

    public function test_completion_score_weights_match_across_platforms(): void
    {
        $mobile = $this->extractWeights($this->mobileSource());
        $web = $this->extractWeights($this->webSource());

        $this->assertSame(
            $mobile,
            $web,
            'MCS_WEIGHTS differ. The same patient would get a different completion score per platform.'
        );
    }

    public function test_completion_score_weights_sum_to_one(): void
    {
        $this->assertEqualsWithDelta(
            1.0,
            array_sum($this->extractWeights($this->mobileSource())),
            0.0001,
            'MCS_WEIGHTS must sum to 1.0 so that a fully-answered score is on the same scale as a partial one.'
        );
    }

    public function test_minimum_component_floor_matches_across_platforms(): void
    {
        preg_match('/MCS_MIN_COMPONENTS[^=]*=\s*(\d+)/', $this->mobileSource(), $m1);
        preg_match('/MCS_MIN_COMPONENTS[^=]*=\s*(\d+)/', $this->webSource(), $m2);

        $this->assertNotEmpty($m1, 'MCS_MIN_COMPONENTS missing from mobile engine');
        $this->assertNotEmpty($m2, 'MCS_MIN_COMPONENTS missing from web engine');
        $this->assertSame($m1[1], $m2[1], 'MCS_MIN_COMPONENTS differs between platforms.');
    }

    public function test_both_engines_define_the_v3_functions(): void
    {
        $required = [
            'ratingOrNull',
            'triStateOrNull',
            'readBodySystems',
            'computeBodySystemsView',
            'computeWeeklyHealthScore',
            'buildLabRecommendations',
            'computeMedicationCompletion',
        ];

        $mobile = $this->mobileSource();
        $web = $this->webSource();

        foreach ($required as $fn) {
            $this->assertStringContainsString($fn, $mobile, "mobile engine is missing {$fn}");
            $this->assertStringContainsString($fn, $web, "web engine is missing {$fn}");
        }
    }
}
