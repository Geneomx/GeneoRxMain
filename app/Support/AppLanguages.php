<?php

namespace App\Support;

class AppLanguages
{
    public static function all(): array
    {
        $fromConfig = config('languages');
        if (is_array($fromConfig) && count($fromConfig) > 0) {
            return $fromConfig;
        }

        $path = resource_path('data/languages.php');
        if (is_file($path)) {
            $languages = require $path;

            return is_array($languages) ? $languages : [];
        }

        return [];
    }

    /**
     * Languages that are complete enough to offer in the pickers. Anything
     * without an explicit `enabled => false` is treated as enabled, so older
     * config that predates the flag keeps working.
     */
    public static function enabled(): array
    {
        return array_values(array_filter(
            self::all(),
            fn ($lang) => ($lang['enabled'] ?? true) !== false,
        ));
    }

    /** Whether a given language code is enabled (unknown codes are not). */
    public static function isEnabled(?string $code): bool
    {
        foreach (self::enabled() as $lang) {
            if (($lang['code'] ?? '') === $code) {
                return true;
            }
        }

        return false;
    }

    public static function find(?string $code): array
    {
        $languages = self::all();
        foreach ($languages as $lang) {
            if (($lang['code'] ?? '') === $code) {
                return $lang;
            }
        }

        return $languages[0] ?? ['code' => 'en', 'label' => 'English', 'native_label' => 'English', 'web_path' => ''];
    }
}
