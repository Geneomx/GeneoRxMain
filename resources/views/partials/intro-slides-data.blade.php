@php
    use App\Support\IntroSlides;

    if (! is_array($introSlides ?? null) || count($introSlides) === 0) {
        $introSlides = IntroSlides::all();
    }
@endphp
