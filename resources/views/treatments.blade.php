@extends('layouts.portal')

@section('content')

  @if(session('is_web_guest'))
  <div class="guest-bar" role="status">
    <span data-i18n="save_account.guest_bar">Guest mode — progress saved on this device.</span>
    <div class="guest-bar-btns">
      <button type="button" class="primary mini" id="guestBarSaveAccount" data-i18n="save_account.guest_bar_btn">Save to account</button>
    </div>
  </div>
  @endif

  <div class="top portal-top">
    <div class="brand portal-brand">
      @include('partials.geneorx-brand', [
        'variant' => 'full',
        'size' => 44,
        'fullHeight' => 34,
        'subtitle' => 'Portal',
        'subtitleI18n' => 'portal.badge',
        'href' => route('home'),
        'class' => 'brand-logo-link',
      ])
    </div>
    <div class="status portal-status">
      @include('partials.language-selector')
      <button class="ghost mini" id="btnMyCheckins" data-i18n="portal.mycheckins">My check-ins</button>
      <button class="ghost mini" id="btnShare" data-i18n="portal.share">Share for review</button>
      <div class="badge"><span data-i18n="portal.plan_label">Plan:</span> <strong id="pillPlan">Not started</strong></div>
      <div class="badge badge-click" id="pillChecksBadge" data-i18n-aria="tooltip.checkins_badge">
        <span data-i18n="portal.checkins_label">Check-ins:</span> <strong id="pillChecks">0</strong>
      </div>
      @auth
        @if(session('is_web_guest'))
          <div class="badge"><span data-i18n="portal.user_label">User:</span> <strong id="pillUser">Guest</strong></div>
        @else
          <div class="portal-menu" id="portalProfileMenu">
            <button type="button" class="ghost mini portal-menu-trigger" id="portalProfileTrigger" aria-haspopup="true" aria-expanded="false" data-i18n="portal.profile">Profile</button>
            <div class="portal-menu-panel" id="portalProfilePanel" hidden>
              <div class="portal-menu-email" id="portalProfileEmail">{{ Auth::user()->email }}</div>
              <button type="button" class="portal-menu-item" id="btnHealthProfile" data-i18n="portal.health_profile">Health profile</button>
              <a href="{{ route('account.settings') }}" class="portal-menu-item" data-i18n="portal.account_settings">Account settings</a>
              <form method="POST" action="{{ route('logout') }}" class="portal-menu-logout">
                @csrf
                <button type="submit" class="portal-menu-item portal-menu-item--danger" data-i18n="portal.logout">Logout</button>
              </form>
            </div>
          </div>
        @endif
      @else
        <div class="badge"><span data-i18n="portal.user_label">User:</span> <strong id="pillUser">Guest</strong></div>
        <a href="{{ route('login') }}" class="ghost mini portal-link-btn" data-i18n="portal.signin">Sign in</a>
      @endauth
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="hd">
        <div class="hd-top">
          <div>
            <h2 id="mainTitle">Account</h2>
            <div class="desc" id="mainSub">Enter basic details to begin.</div>
          </div>
        </div>
        <div class="steps" id="steps"></div>
      </div>
      <div class="bd" id="main"></div>
    </div>

    <div class="card" id="summaryPanel">
      <div class="hd">
        <div>
          <h2 data-i18n="summary.panel_title">Summary</h2>
          <div class="desc" data-i18n="summary.panel_desc">Quick recap while you work through steps</div>
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
