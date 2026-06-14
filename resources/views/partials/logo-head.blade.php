<link rel="icon" type="image/svg+xml" href="{{ \App\Support\LogoAssets::url('logo.svg') }}">
@if(is_file(public_path('favicon.png')))
<link rel="icon" type="image/png" sizes="192x192" href="{{ \App\Support\LogoAssets::url('favicon.png') }}">
@endif
@if(is_file(public_path('apple-touch-icon.png')))
<link rel="apple-touch-icon" href="{{ \App\Support\LogoAssets::url('apple-touch-icon.png') }}">
@endif
