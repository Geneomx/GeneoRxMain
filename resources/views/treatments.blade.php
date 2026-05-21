@extends('layouts.app')

@section('content')

  <meta name="csrf-token" content="{{ csrf_token() }}">

  {{-- ── Guest demo banner ───────────────────────────────────────────────── --}}
  @if(session('is_web_guest'))
  <div style="
    background: #FFFBEB;
    border: 1px solid #FDE68A;
    border-radius: 10px;
    padding: 12px 18px;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 14px;
    color: #92400E;
  ">
    <span>
      <strong>You're browsing as a guest.</strong>
      Changes you make here are not saved   create a free account to keep your data.
    </span>
    <div style="display:flex; gap:8px; flex-shrink:0;">
      <a href="{{ route('register') }}" class="btn btn-primary btn-sm">Create free account</a>
      <a href="{{ route('login') }}"    class="btn btn-outline btn-sm">Sign in</a>
    </div>
  </div>
  @endif

  <div class="page-head">
    <div>
      <span class="eyebrow">Patient workspace</span>
      <h1>Dashboard</h1>
      <div class="sub">Personalized medication, symptom, and progress insights.</div>
    </div>
    <div class="actions">
      <div class="badge">Routine: <strong id="pillPlan">Not started</strong></div>
      <div class="badge">Check-ins: <strong id="pillChecks">0</strong></div>
      <div class="badge save-status" id="saveStatus">Saved</div>
      <button class="btn btn-outline btn-sm" id="btnShare">Doctor summary</button>
    </div>
  </div>
  <div class="grid">
      <!-- MAIN -->
      <div class="card">
        <div class="hd">
          <div>
            <h2 id="mainTitle">Account</h2>
            <div class="desc" id="mainSub">Enter basic details to begin.</div>
          </div>
          <div class="steps" id="steps"></div>
        </div>
        <div class="bd" id="main"></div>
      </div>

      <!-- SIDE -->
      <div class="card" id="summaryPanel">
        <div class="hd">
          <div>
            <h2>Your progress</h2>
            <div class="desc">What you’ve entered so far</div>
          </div>
          <div>
            <button class="ghost summary-toggle" id="btnToggleSummary" type="button">View progress summary</button>
            <button class="ghost" id="btnReset">Reset</button>
          </div>
        </div>
        <div class="bd" id="summaryBody">
          <div class="section" id="summaryTop"></div>
          <div style="height:14px"></div>
          <div class="list" id="side"></div>
          <div style="height:14px"></div>
          <div class="contactBox" id="contactBox"></div>
        </div>
      </div>
    </div>

  @endsection

  @section('scripts')
   @include('include.script')
  @endsection