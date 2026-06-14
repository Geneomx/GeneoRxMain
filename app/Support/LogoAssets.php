<?php

namespace App\Support;

class LogoAssets
{
    public static function url(string $filename = 'logo.svg'): string
    {
        $path = public_path($filename);

        if (! is_file($path)) {
            if ($filename !== 'logo.svg' && is_file(public_path('logo.svg'))) {
                return self::url('logo.svg');
            }

            return asset($filename);
        }

        return asset($filename).'?v='.filemtime($path);
    }

    public static function mark(): string
    {
        return self::url(is_file(public_path('logo-mark.png')) ? 'logo-mark.png' : 'logo.svg');
    }

    public static function full(): string
    {
        if (is_file(public_path('logo.png'))) {
            return self::url('logo.png');
        }

        if (is_file(public_path('logo-full.svg'))) {
            return self::url('logo-full.svg');
        }

        return self::mark();
    }
}
