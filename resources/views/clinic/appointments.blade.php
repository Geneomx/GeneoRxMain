@extends('clinic.layout')
@section('title', 'Appointments')

@section('content')
<div class="page-head">
  <h1>Your appointments</h1>
  <p>Patients who booked a time with you. Confirming tells them it is going ahead; declining frees the time for someone else.</p>
</div>

<div class="card">
  <div class="card-hd">
    <h2>Today</h2>
    <p>{{ $today->count() }} {{ Str::plural('appointment', $today->count()) }}</p>
  </div>
  @forelse ($today as $a)
    @include('clinic.partials.appointment', ['a' => $a])
  @empty
    <div class="empty">Nothing booked for today.</div>
  @endforelse
</div>

<div class="card">
  <div class="card-hd">
    <h2>Coming up</h2>
    <p>{{ $upcoming->count() }} {{ Str::plural('appointment', $upcoming->count()) }}</p>
  </div>
  @forelse ($upcoming as $a)
    @include('clinic.partials.appointment', ['a' => $a])
  @empty
    <div class="empty">Nothing booked yet.</div>
  @endforelse
</div>

@if ($undated->isNotEmpty())
  <div class="card">
    <div class="card-hd">
      <h2>No time chosen</h2>
      <p>Sent from an older version of the app, which asked for a day rather than a time. Reply with a time that suits you.</p>
    </div>
    @foreach ($undated as $a)
      @include('clinic.partials.appointment', ['a' => $a])
    @endforeach
  </div>
@endif

@if ($past->isNotEmpty())
  <div class="card">
    <div class="card-hd">
      <h2>Finished</h2>
      <p>The last {{ $past->count() }}</p>
    </div>
    @foreach ($past as $a)
      @include('clinic.partials.appointment', ['a' => $a])
    @endforeach
  </div>
@endif
@endsection
