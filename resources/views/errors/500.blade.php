@extends('errors.layout', ['code' => 500, 'title' => 'Something went wrong'])

@section('error-content')
  <p class="error-message">
    We hit an unexpected problem on our side. Our team has been notified. Please try again in a moment.
  </p>
  <div class="error-actions">
    <a href="{{ url('/') }}" class="btn btn-primary">Back to home</a>
    <a href="mailto:info@geneorx.com" class="btn btn-outline">Contact support</a>
  </div>
@endsection
