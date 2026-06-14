<?php

require __DIR__ . '/../../vendor/autoload.php';

$app = require __DIR__ . '/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$all = App\Support\SiteTranslations::all();
$out = __DIR__ . '/../src/content/i18nPacks.json';

file_put_contents(
    $out,
    json_encode($all, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
);

echo 'Wrote ' . count($all) . " languages to {$out}\n";
foreach ($all as $lang => $keys) {
    echo "  {$lang}: " . count($keys) . " keys\n";
}
