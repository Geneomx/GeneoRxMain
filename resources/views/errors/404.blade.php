@extends('errors.layout', ['code' => 404, 'title' => 'Page not found'])

@section('error-content')
  <p class="error-message">
    The page you are looking for does not exist or has moved. Let us get you back on track.
  </p>
  <div class="error-actions">
    <a href="{{ url('/') }}" class="btn btn-primary">Back to home</a>
    <a href="mailto:info@geneorx.com" class="btn btn-outline">Contact support</a>
  </div>
@endsection
