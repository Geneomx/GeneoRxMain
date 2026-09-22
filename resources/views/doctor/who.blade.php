{{-- "Who would you like to ask?" — a radio group of the active directory.
     Included once per form, because a radio input can belong to one form only.
     Only the public shape (toPublicArray) ever reaches this partial. --}}
<div class="docChips" role="radiogroup">
  <label class="docChip">
    <input type="radio" name="doctor_id" value="" @checked(old('doctor_id', '') === '')>
    <span data-i18n="doctor.any">Any doctor</span>
  </label>
  @foreach($doctors as $d)
    <label class="docChip">
      <input type="radio" name="doctor_id" value="{{ $d['id'] }}" @checked((string) old('doctor_id') === (string) $d['id'])>
      <span>{{ $d['name'] }}@if(!empty($d['specialty']))<small>{{ $d['specialty'] }}</small>@endif</span>
    </label>
  @endforeach
</div>
@if($doctors->isEmpty())
  <div class="docFine" data-i18n="doctor.none_yet">No doctors have been added yet. You can still send a question and it will go to whoever is available.</div>
@endif
