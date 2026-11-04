<?php

namespace Tests\Feature;

use App\Services\MedicationLabelReader;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MedicationLabelTest extends TestCase
{
    private function image(int $width = 100, int $height = 100): string
    {
        $im = imagecreatetruecolor($width, $height);
        ob_start();
        imagepng($im);
        $bytes = ob_get_clean();
        imagedestroy($im);

        return base64_encode($bytes);
    }

    /**
     * A PNG signature plus IHDR header only. getimagesize reads the dimensions
     * from the header, so this stands in for a huge photo without allocating it.
     */
    private function pngHeaderClaiming(int $width, int $height): string
    {
        return base64_encode("\x89PNG\r\n\x1a\n"."\x00\x00\x00\x0dIHDR".pack('NN', $width, $height)."\x08\x02\x00\x00\x00");
    }

    public function test_each_rejected_photo_gets_its_own_plain_language_reason(): void
    {
        $this->mock(MedicationLabelReader::class)->shouldNotReceive('read');

        $format = 'Choose a JPG or PNG photo of the label.';
        $this->postJson('/api/mobile/medication-label', ['consent' => true, 'image' => base64_encode('not an image at all')])
            ->assertUnprocessable()->assertJsonPath('message', $format);
        $gif = imagecreatetruecolor(100, 100);
        ob_start();
        imagegif($gif);
        $gifBytes = ob_get_clean();
        imagedestroy($gif);
        $this->postJson('/api/mobile/medication-label', ['consent' => true, 'image' => base64_encode($gifBytes)])
            ->assertUnprocessable()->assertJsonPath('message', $format);

        $this->postJson('/api/mobile/medication-label', ['consent' => true, 'image' => $this->image(40, 40)])
            ->assertUnprocessable()->assertJsonPath('message', 'That photo is too small to read. Take a closer photo of the label.');
        $this->postJson('/api/mobile/medication-label', ['consent' => true, 'image' => $this->image(400, 79)])
            ->assertUnprocessable()->assertJsonPath('message', 'That photo is too small to read. Take a closer photo of the label.');

        $this->postJson('/api/mobile/medication-label', ['consent' => true, 'image' => $this->pngHeaderClaiming(5000, 5000)])
            ->assertUnprocessable()->assertJsonPath('message', 'That photo is too large. Choose one under 20 megapixels or take a closer photo of the label.');
    }

    public function test_an_image_with_no_readable_text_keeps_its_own_message(): void
    {
        $this->mock(MedicationLabelReader::class)->shouldReceive('read')->once()->andReturn(['text' => '', 'source' => 'server_ocr']);
        $this->postJson('/api/mobile/medication-label', ['consent' => true, 'image' => $this->image()])
            ->assertUnprocessable()->assertJsonPath('message', 'No readable text was found. Try a clearer photo or enter the label text.');
    }

    public function test_label_photo_requires_explicit_processing_consent(): void
    {
        $this->postJson('/api/mobile/medication-label', ['image' => $this->image()])->assertUnprocessable()->assertJsonValidationErrors('consent');
    }

    public function test_only_valid_bounded_images_reach_the_reader(): void
    {
        $this->mock(MedicationLabelReader::class)->shouldNotReceive('read');
        $this->postJson('/api/mobile/medication-label', ['consent' => true, 'image' => base64_encode('<svg onload="bad()"/>')])->assertUnprocessable();
    }

    public function test_reader_returns_text_without_a_cloud_request_or_storing_a_photo(): void
    {
        Http::preventStrayRequests();
        $this->mock(MedicationLabelReader::class)->shouldReceive('read')->once()->andReturn(['text' => 'Metformin 500 mg', 'source' => 'server_ocr']);
        $this->postJson('/api/mobile/medication-label', ['consent' => true, 'image' => $this->image()])->assertOk()->assertJsonPath('text', 'Metformin 500 mg')->assertHeader('Cache-Control', 'no-store, private');
        Http::assertNothingSent();
    }

    public function test_reader_failures_offer_manual_entry_without_exposing_the_process(): void
    {
        $this->mock(MedicationLabelReader::class)->shouldReceive('read')->once()->andThrow(new \RuntimeException('sensitive process detail'));
        $response = $this->postJson('/api/mobile/medication-label', ['consent' => true, 'image' => $this->image()])->assertStatus(503);
        $this->assertStringNotContainsString('sensitive process detail', $response->getContent());
    }
}
