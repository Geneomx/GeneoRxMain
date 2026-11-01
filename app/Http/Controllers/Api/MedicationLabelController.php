<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MedicationLabelReader;
use Illuminate\Http\Request;
use Throwable;

class MedicationLabelController extends Controller
{
    public function __invoke(Request $request, MedicationLabelReader $reader)
    {
        $data = $request->validate([
            'consent' => 'required|accepted',
            'image' => 'required|string|max:5600000',
        ]);
        $image = base64_decode($data['image'], true);
        if ($image === false) {
            return $this->reject('Choose a JPG or PNG photo of the label.');
        }
        if (strlen($image) > 4200000) {
            return $this->reject('That photo is too large. Choose one under 4 MB.');
        }
        $info = @getimagesizefromstring($image);
        if (! $info || ! in_array($info['mime'], ['image/jpeg', 'image/png'], true)) {
            return $this->reject('Choose a JPG or PNG photo of the label.');
        }
        if ($info[0] * $info[1] > 20000000) {
            return $this->reject('That photo is too large. Choose one under 20 megapixels or take a closer photo of the label.');
        }
        if (min($info[0], $info[1]) < 80) {
            return $this->reject('That photo is too small to read. Take a closer photo of the label.');
        }
        try {
            $result = $reader->read($data['image']);
            if ($result['text'] === '') {
                return response()->json(['message' => 'No readable text was found. Try a clearer photo or enter the label text.'], 422);
            }

            return response()->json($result)->header('Cache-Control', 'no-store, private');
        } catch (Throwable) {
            return response()->json(['message' => 'The photo could not be read. You can paste label text or enter the medication instead.'], 503);
        }
    }

    /**
     * Each image gate gets its own plain-language reason so an older adult
     * knows what to change (format, size, or distance) instead of guessing.
     */
    private function reject(string $message)
    {
        return response()->json(['message' => $message], 422);
    }
}
