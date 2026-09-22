{{-- What patients can book: working days, hours and minutes per patient.
     Used by both the "Add a doctor" and "Edit details" forms on admin/doctors.
     Expects $days (int[]), $from, $to, $slot. --}}
<div style="margin-top:14px;padding:14px 16px;border:1px solid var(--border);border-radius:10px;background:var(--bg-soft,transparent);">
  <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px;">
    Availability <span style="font-weight:400;">&mdash; the times patients can book. A booked time is held until you confirm or decline it.</span>
  </div>
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
    @foreach ([1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 7 => 'Sun'] as $n => $label)
      <label style="display:inline-flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;">
        <input type="checkbox" name="available_days[]" value="{{ $n }}" @checked(in_array($n, $days, true))> {{ $label }}
      </label>
    @endforeach
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:12px;">
    <div>
      <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">From</label>
      <input type="time" name="available_from" value="{{ $from }}" required style="width:100%;">
    </div>
    <div>
      <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">To</label>
      <input type="time" name="available_to" value="{{ $to }}" required style="width:100%;">
    </div>
    <div>
      <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">Minutes per patient</label>
      <input type="number" name="slot_minutes" value="{{ $slot }}" min="5" max="180" step="5" required style="width:100%;">
    </div>
  </div>
</div>
