@extends('errors.layout', ['code' => 403, 'title' => 'Access denied'])

@section('error-content')
  <p class="error-message">
    You do not have permission to view this page. If you think this is a mistake, please contact support.
  </p>
  <div class="error-actions">
    <a href="{{ url('/') }}" class="btn btn-primary">Back to home</a>
    <a href="mailto:info@geneorx.com" class="btn btn-outline">Contact support</a>
  </div>
@endsection
