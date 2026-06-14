<?php

namespace App\Support;

class LogoAssets
{
    public static function url(string $filename = 'logo.svg'): string
    {
        $path = public_path($filename);

        if (! is_file($path)) {
            return asset($filename);
        }

        return asset($filename).'?v='.filemtime($path);
    }
}
