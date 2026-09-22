@extends('admin.layout')
@section('title', 'Doctors')

@section('content')
<div class="page-header">
  <div>
    <h1>Doctors</h1>
    <p>The clinician directory. Added here only &mdash; there is no self-registration.</p>
  </div>
</div>

<div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
  <div class="stat-card">
    <div class="stat-label">Active</div>
    <div class="stat-value {{ $counts['active'] > 0 ? 'teal' : '' }}">{{ number_format($counts['active']) }}</div>
    <div class="stat-sub">Taking questions</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Inactive</div>
    <div class="stat-value">{{ number_format($counts['inactive']) }}</div>
    <div class="stat-sub">Past answers stay visible</div>
  </div>
</div>

{{-- Add a doctor --}}
<div class="admin-card" style="margin-bottom:20px;">
  <div class="admin-card-hd">
    <div>
      <h2>Add a doctor</h2>
      <p>Mobile and email are for you to reach them. Neither is ever sent to the app.</p>
    </div>
  </div>
  <form method="POST" action="{{ route('admin.doctors.store') }}" style="padding:18px 22px;">
    @csrf
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;">
      <div>
        <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">Name *</label>
        <input type="text" name="name" required maxlength="160" value="{{ old('name') }}" style="width:100%;">
      </div>
      <div>
        <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">Specialty</label>
        <input type="text" name="specialty" maxlength="120" value="{{ old('specialty') }}"
               placeholder="Internal medicine" style="width:100%;">
      </div>
      <div>
        <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">Mobile</label>
        <input type="text" name="mobile" maxlength="40" value="{{ old('mobile') }}" style="width:100%;">
      </div>
      <div>
        <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">Email</label>
        <input type="email" name="email" maxlength="255" value="{{ old('email') }}" style="width:100%;">
      </div>
    </div>
    <div style="margin-top:14px;">
      <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">
        Bio <span style="font-weight:400;">&mdash; patients see this</span>
      </label>
      <textarea name="bio" rows="2" maxlength="2000" style="width:100%;">{{ old('bio') }}</textarea>
    </div>
    @include('admin.partials.doctor-availability', [
      'days' => array_map('intval', (array) old('available_days', \App\Support\DoctorSchedule::DEFAULT_DAYS)),
      'from' => old('available_from', \App\Support\DoctorSchedule::DEFAULT_FROM),
      'to' => old('available_to', \App\Support\DoctorSchedule::DEFAULT_TO),
      'slot' => old('slot_minutes', \App\Support\DoctorSchedule::DEFAULT_SLOT_MINUTES),
    ])
    <div style="margin-top:14px;">
      <button type="submit" class="btn btn-primary">Add to directory</button>
    </div>
  </form>
</div>

{{-- Filter --}}
<div class="admin-card" style="margin-bottom:20px;">
  <form method="GET" style="display:flex;gap:12px;align-items:flex-end;padding:18px;">
    <div>
      <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">Status</label>
      <select name="status" style="min-width:150px;">
        <option value="">All</option>
        <option value="active" @selected(request('status') === 'active')>Active</option>
        <option value="inactive" @selected(request('status') === 'inactive')>Inactive</option>
      </select>
    </div>
    <button type="submit" class="btn btn-primary">Filter</button>
    @if (request('status'))
      <a href="{{ route('admin.doctors') }}" class="btn btn-ghost">Clear</a>
    @endif
  </form>
</div>

{{-- Directory --}}
<div class="admin-card">
  <div class="admin-card-hd">
    <div>
      <h2>Directory</h2>
      <p>{{ $doctors->total() }} total</p>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;">
    @forelse ($doctors as $doctor)
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);">
        <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;">
          <div style="flex:1;min-width:240px;">
            <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;">
              <strong style="font-size:15px;">{{ $doctor->name }}</strong>
              @if ($doctor->is_active)
                <span class="badge badge-success">Active</span>
              @else
                <span class="badge">Inactive</span>
              @endif
              @if ($doctor->specialty)
                <span style="font-size:13px;color:var(--text-muted);">{{ $doctor->specialty }}</span>
              @endif
            </div>

            <div style="font-size:13px;color:var(--text-muted);margin-top:5px;">
              {{ $doctor->messages_count }} {{ Str::plural('question', $doctor->messages_count) }}
              &middot;
              {{ $doctor->appointment_requests_count }} {{ Str::plural('request', $doctor->appointment_requests_count) }}
              @if ($doctor->mobile)
                &middot; <span style="font-family:ui-monospace,monospace;">{{ $doctor->mobile }}</span>
              @endif
              @if ($doctor->email)
                &middot; {{ $doctor->email }}
              @endif
            </div>

            <div style="font-size:13px;color:var(--text-muted);margin-top:5px;">
              Bookable {{ $doctor->availabilitySummary() }}
            </div>

            @if ($doctor->bio)
              <div style="font-size:13px;color:var(--text);margin-top:8px;max-width:70ch;">{{ $doctor->bio }}</div>
            @endif

            @if ($doctor->creator)
              <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">
                Added by {{ $doctor->creator->email }} &middot; {{ $doctor->created_at->diffForHumans() }}
              </div>
            @endif
          </div>

          <div style="display:flex;gap:8px;align-items:flex-start;">
            <form method="POST" action="{{ route('admin.doctors.toggle', $doctor) }}">
              @csrf
              <button type="submit" class="btn btn-ghost">
                {{ $doctor->is_active ? 'Deactivate' : 'Reactivate' }}
              </button>
            </form>
          </div>
        </div>

        {{-- Edit, collapsed --}}
        <details style="margin-top:12px;">
          <summary style="cursor:pointer;font-size:13px;color:var(--text-muted);">Edit details</summary>
          <form method="POST" action="{{ route('admin.doctors.update', $doctor) }}" style="margin-top:12px;">
            @csrf
            @method('PUT')
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">
              <input type="text" name="name" required maxlength="160" value="{{ $doctor->name }}" placeholder="Name">
              <input type="text" name="specialty" maxlength="120" value="{{ $doctor->specialty }}" placeholder="Specialty">
              <input type="text" name="mobile" maxlength="40" value="{{ $doctor->mobile }}" placeholder="Mobile">
              <input type="email" name="email" maxlength="255" value="{{ $doctor->email }}" placeholder="Email">
            </div>
            <textarea name="bio" rows="2" maxlength="2000" placeholder="Bio"
                      style="width:100%;margin-top:12px;">{{ $doctor->bio }}</textarea>
            @include('admin.partials.doctor-availability', [
              'days' => $doctor->availableDays(),
              'from' => $doctor->available_from ?? \App\Support\DoctorSchedule::DEFAULT_FROM,
              'to' => $doctor->available_to ?? \App\Support\DoctorSchedule::DEFAULT_TO,
              'slot' => $doctor->slot_minutes ?: \App\Support\DoctorSchedule::DEFAULT_SLOT_MINUTES,
            ])
            <button type="submit" class="btn btn-primary" style="margin-top:12px;">Save changes</button>
          </form>
        </details>
      </div>
    @empty
      <div style="padding:40px 22px;text-align:center;color:var(--text-muted);">
        No doctors yet. Add one above &mdash; until then the app shows patients an empty directory
        and offers to send their question to whoever is available.
      </div>
    @endforelse
  </div>

  @if ($doctors->hasPages())
    <div style="padding:18px 22px;">{{ $doctors->links() }}</div>
  @endif
</div>
@endsection
