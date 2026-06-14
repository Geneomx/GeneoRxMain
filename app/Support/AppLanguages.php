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
