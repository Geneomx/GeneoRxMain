<?php

namespace App\Services;

use RuntimeException;
use Symfony\Component\Process\Process;

class MedicationLabelReader
{
    public function read(string $image): array
    {
        $env = [];
        if (PHP_OS_FAMILY === 'Windows') {
            // Symfony's HTTP environment filtering can omit Windows variables
            // required by Node's crypto initialization, even when CLI works.
            foreach (['SystemRoot', 'windir', 'PATH', 'ComSpec', 'TEMP', 'TMP'] as $key) {
                $value = getenv($key);
                if ($value !== false) {
                    $env[$key] = $value;
                }
            }
        }
        $process = new Process([
            config('services.label_reader.node', 'node'),
            base_path('scripts/read-medication-label.mjs'),
        ], base_path(), $env, $image, 50);
        $process->run();
        if (! $process->isSuccessful()) {
            // Do not expose process output, filenames, or prescription text.
            throw new RuntimeException('Label reader unavailable');
        }
        $result = json_decode($process->getOutput(), true);
        if (! is_array($result) || ! is_string($result['text'] ?? null)) {
            throw new RuntimeException('Label reader unavailable');
        }

        return ['text' => mb_substr(trim($result['text']), 0, 10000), 'source' => 'server_ocr'];
    }
}
