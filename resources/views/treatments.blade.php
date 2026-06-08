@extends('layouts.portal')

@section('content')

  <div class="top">
    <div class="brand">
      @include('partials.geneorx-brand', ['size' => 44, 'showName' => false, 'href' => route('home'), 'class' => 'brand-logo-link'])
      <div>
        <h1>GeneoRx — Trusted Health Companion Portal</h1>
        <p class="sub">Your trusted health companion for smarter medication, symptom, and nutrient support</p>
      </div>
    </div>
    <div class="status">
      <button class="ghost mini" id="btnMyCheckins">My check-ins</button>
      <button class="ghost mini" id="btnShare">Share for review</button>
      <div class="badge">User: <strong id="pillUser">Guest</strong></div>
      <div class="badge">Plan: <strong id="pillPlan">Not started</strong></div>
      <div class="badge badge-click" id="pillChecksBadge" title="Open my check-ins">
        Check-ins: <strong id="pillChecks">0</strong>
      </div>
      @auth
        @if(session('is_web_guest'))
          <a href="{{ route('login') }}" class="ghost mini" style="text-decoration:none">Sign in to your account</a>
          <a href="{{ route('register') }}" class="ghost mini" style="text-decoration:none">Create account</a>
        @else
          <form method="POST" action="{{ route('logout') }}" style="display:inline;margin:0">
            @csrf
            <button type="submit" class="ghost mini">Logout</button>
          </form>
        @endif
      @else
        <a href="{{ route('login') }}" class="ghost mini" style="text-decoration:none">Sign in</a>
      @endauth
    </div>
  </div>

  <div class="grid">
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

    <div class="card" id="summaryPanel">
      <div class="hd">
        <div>
          <h2>Summary</h2>
          <div class="desc">Quick recap while you work through steps</div>
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
