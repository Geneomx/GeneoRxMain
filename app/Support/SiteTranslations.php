<?php

namespace App\Support;

class SiteTranslations
{
    public static function all(): array
    {
        $sitePath = resource_path('data/site_translations.php');
        $portalPath = resource_path('data/portal_translations.php');

        $site = is_file($sitePath) ? require $sitePath : ['en' => []];
        $portal = is_file($portalPath) ? require $portalPath : ['en' => []];

        if (! is_array($site)) {
            $site = ['en' => []];
        }
        if (! is_array($portal)) {
            $portal = ['en' => []];
        }

        $clean = require resource_path('data/clean_translations.php');
        $review = require resource_path('data/review_translations.php');

        $langs = array_unique(array_merge(array_keys($site), array_keys($portal)));
        $merged = [];

        foreach ($langs as $lang) {
            $siteLang = $site[$lang] ?? [];
            $portalLang = $portal[$lang] ?? [];
            $merged[$lang] = array_merge($siteLang, $portalLang, $clean[$lang] ?? $clean['en'], $review);
        }

        return $merged ?: ['en' => []];
    }

    /** @return string[] */
    public static function rtlCodes(): array
    {
        return ['ar', 'ur'];
    }
}
