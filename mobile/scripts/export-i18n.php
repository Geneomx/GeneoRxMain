<?php

use App\Support\SiteTranslations;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$out = __DIR__.'/../src/content/i18nPacks.json';

// The PHP translation files are the source of truth for shared web+mobile
// strings, but the mobile app also has MOBILE-ONLY keys (e.g. home.*,
// summary.ai_*, nav.home) that live only in this JSON pack. A plain overwrite
// would silently delete them, so MERGE: PHP wins for keys it defines, and any
// mobile-only key already in the pack is preserved.
$fromPhp = SiteTranslations::all();

$existing = [];
if (is_file($out)) {
    $decoded = json_decode((string) file_get_contents($out), true);
    if (is_array($decoded)) {
        $existing = $decoded;
    }
}

$merged = [];
$langs = array_unique([...array_keys($existing), ...array_keys($fromPhp)]);
foreach ($langs as $lang) {
    // array_merge with PHP second so the source of truth overrides stale copies,
    // while mobile-only keys present only in $existing survive.
    $merged[$lang] = array_merge($existing[$lang] ?? [], $fromPhp[$lang] ?? []);
    ksort($merged[$lang]);
}

file_put_contents(
    $out,
    json_encode($merged, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
);

echo 'Wrote '.count($merged)." languages to {$out}\n";
foreach ($merged as $lang => $keys) {
    echo "  {$lang}: ".count($keys)." keys\n";
}
