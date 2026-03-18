@extends('layouts.app')

@section('content')

  <meta name="csrf-token" content="{{ csrf_token() }}">
   
  <div class="top">
      <div class="brand">
        <div class="brandmark" title="GeneoRx">
          <!-- ✅ Your exact logo file name -->
          <img src="{{ asset('logo.jpeg') }}" alt="GeneoRx logo" />
        </div>
        <div>
          <h1>GeneoRx the Intelligence Behind Your Medications</h1>
          <p class="sub">Your trusted health companion for smarter medication, symptom, and nutrient support</p>
        </div>
      </div>
          <div class="status">
                <button class="ghost mini" id="btnShare">Share for review</button>
                <div class="badge">User: <strong id="pillUser">@if(Auth::check()){{ Auth::user()->name }}@else Guest @endif</strong></div>
                <div class="badge">Plan: <strong id="pillPlan">Not started  1</strong></div>
                <div class="badge">Check-ins: <strong id="pillChecks">0</strong></div>
                @if(Auth::check())
                  <form method="POST" action="{{ route('logout') }}" style="display:inline;">
                    @csrf
                    <button type="submit" class="ghost mini btn btn-danger">Logout</button>
                  </form>
                @endif
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
            <h2>Summary</h2>
            <div class="desc">What you’ve entered so far</div>
          </div>
          <div>
            <button class="ghost" id="btnReset">Reset</button>
          </div>
        </div>
        <div class="bd">
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