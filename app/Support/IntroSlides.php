<?php

namespace App\Support;

class IntroSlides
{
    public static function all(): array
    {
        $fromConfig = config('intro_slides');
        if (is_array($fromConfig) && count($fromConfig) > 0) {
            return $fromConfig;
        }

        $path = resource_path('data/intro_slides.php');
        if (is_file($path)) {
            $slides = require $path;

            return is_array($slides) ? $slides : [];
        }

        return [];
    }
}
