<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>GeneoRx Clinic &middot; @yield('title', 'Appointments')</title>
  @include('partials.logo-head')
  @include('partials.brand-logo-styles')
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* The clinician's own area. Same dark tokens as the admin panel so the two
       feel like one product, but deliberately its own layout: a doctor must
       never see admin navigation. */
    :root {
      --teal:#28E1FF; --teal-50:rgba(40,225,255,.10); --teal-100:rgba(40,225,255,.22);
      --bg:#0F1736; --bg-soft:#070A12; --bg-muted:rgba(15,23,54,.55); --bar:#0B1022;
      --text:#EAF0FF; --text-soft:#A9B4D6; --text-muted:#7E8AB8; --text-dim:#5A6490;
      --border:rgba(255,255,255,.12); --border-soft:rgba(255,255,255,.08);
      --success:#34D399; --success-bg:rgba(52,211,153,.12); --success-bd:rgba(52,211,153,.32);
      --warn:#FBBF24; --warn-bg:rgba(251,191,36,.12); --warn-bd:rgba(251,191,36,.32);
      --danger:#FB7185; --danger-bg:rgba(251,113,133,.12); --danger-bd:rgba(251,113,133,.34);
      --r:10px; --r-lg:14px; --sans:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:var(--sans);color:var(--text);background:var(--bg-soft);min-height:100vh;line-height:1.55}
    a{color:inherit}

    .bar{display:flex;align-items:center;gap:14px;padding:12px 22px;background:var(--bar);border-bottom:1px solid var(--border);flex-wrap:wrap}
    .bar-brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:-.2px}
    .bar-tag{font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--teal);
      border:1px solid var(--teal-100);background:var(--teal-50);border-radius:999px;padding:3px 9px}
    .bar-spacer{flex:1}
    .bar-who{font-size:13px;color:var(--text-muted)}
    .bar-who strong{color:var(--text);font-weight:600}
    .bar-btn{display:inline-flex;align-items:center;height:34px;padding:0 13px;font-size:13px;font-weight:600;
      border:1px solid var(--border);border-radius:9px;background:transparent;color:var(--text-soft);
      cursor:pointer;text-decoration:none;font-family:inherit}
    .bar-btn:hover{background:var(--bg-muted);border-color:var(--text-muted)}

    .tabs{display:flex;gap:6px;padding:0 22px;background:var(--bar);border-bottom:1px solid var(--border);overflow-x:auto}
    .tab{display:inline-flex;align-items:center;gap:8px;padding:12px 4px;margin-right:18px;font-size:14px;font-weight:600;
      color:var(--text-muted);text-decoration:none;border-bottom:2px solid transparent;white-space:nowrap}
    .tab:hover{color:var(--text)}
    .tab.active{color:var(--teal);border-bottom-color:var(--teal)}
    .tab-count{min-width:20px;height:20px;padding:0 6px;border-radius:999px;font-size:11px;font-weight:800;
      display:inline-flex;align-items:center;justify-content:center;background:var(--danger-bg);
      color:var(--danger);border:1px solid var(--danger-bd)}

    .wrap{max-width:900px;margin:0 auto;padding:22px}
    .page-head{margin-bottom:18px}
    .page-head h1{font-size:22px;font-weight:800;letter-spacing:-.4px}
    .page-head p{font-size:14px;color:var(--text-muted);margin-top:4px}

    .card{background:var(--bg);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:18px}
    .card-hd{padding:14px 18px;border-bottom:1px solid var(--border-soft)}
    .card-hd h2{font-size:15px;font-weight:700}
    .card-hd p{font-size:13px;color:var(--text-muted);margin-top:2px}
    .row{padding:16px 18px;border-bottom:1px solid var(--border-soft)}
    .row:last-child{border-bottom:0}
    .empty{padding:34px 18px;text-align:center;color:var(--text-muted);font-size:14px}

    .badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:11.5px;font-weight:700;
      border:1px solid var(--border);color:var(--text-muted)}
    .badge-success{background:var(--success-bg);border-color:var(--success-bd);color:var(--success)}
    .badge-warn{background:var(--warn-bg);border-color:var(--warn-bd);color:var(--warn)}
    .badge-danger{background:var(--danger-bg);border-color:var(--danger-bd);color:var(--danger)}
    .badge-teal{background:var(--teal-50);border-color:var(--teal-100);color:var(--teal)}

    .btn{display:inline-flex;align-items:center;justify-content:center;height:38px;padding:0 16px;font-size:14px;
      font-weight:600;border-radius:9px;border:1px solid transparent;cursor:pointer;font-family:inherit;text-decoration:none}
    .btn-primary{background:var(--teal);color:#061018;font-weight:700}
    .btn-primary:hover{filter:brightness(1.06)}
    .btn-ghost{background:transparent;color:var(--text-soft);border-color:var(--border)}
    .btn-ghost:hover{background:var(--bg-muted);border-color:var(--text-muted)}
    .btn-sm{height:32px;padding:0 12px;font-size:13px}

    input[type=text],input[type=time],select,textarea{
      width:100%;padding:9px 12px;font-size:14px;font-family:inherit;color:var(--text);
      background:var(--bg-soft);border:1px solid var(--border);border-radius:9px;outline:none}
    input:focus,select:focus,textarea:focus{border-color:var(--teal)}
    textarea{min-height:84px;resize:vertical;line-height:1.5}
    label{display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px}

    .flash{padding:12px 16px;border-radius:var(--r);font-size:14px;margin-bottom:18px;
      background:var(--success-bg);border:1px solid var(--success-bd);color:var(--text)}
    .stack{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
    .muted{font-size:13px;color:var(--text-muted)}
    @media (max-width:640px){ .wrap{padding:16px} .bar{padding:10px 16px} .tabs{padding:0 16px} }
    @yield('styles')
  </style>
</head>
<body>
  <header class="bar">
    <div class="bar-brand">
      GeneoRx <span class="bar-tag">Clinic</span>
    </div>
    <div class="bar-spacer"></div>
    <div class="bar-who">Signed in as <strong>{{ $doctor->name }}</strong></div>
    <form method="POST" action="{{ route('logout') }}">
      @csrf
      <button type="submit" class="bar-btn">Sign out</button>
    </form>
  </header>

  <nav class="tabs">
    <a href="{{ route('clinic.appointments') }}" class="tab {{ request()->routeIs('clinic.appointments') ? 'active' : '' }}">
      Appointments
      @if (($waiting ?? 0) > 0)<span class="tab-count">{{ $waiting }}</span>@endif
    </a>
    <a href="{{ route('clinic.messages') }}" class="tab {{ request()->routeIs('clinic.messages', 'clinic.thread') ? 'active' : '' }}">
      Messages
      @if (($unread ?? 0) > 0)<span class="tab-count">{{ $unread }}</span>@endif
    </a>
  </nav>

  <main class="wrap">
    @if (session('clinic_success'))
      <div class="flash" role="status">
        @switch(session('clinic_success'))
          @case('appointment_confirmed') Appointment confirmed. The patient can see it now. @break
          @case('appointment_declined') Appointment declined, and the time is free for someone else. @break
          @case('appointment_done') Marked as done. @break
          @case('replied') Your reply has been sent to the patient. @break
          @case('closed') Conversation closed. @break
          @default Saved.
        @endswitch
      </div>
    @endif

    @if ($errors->any())
      <div class="flash" style="background:var(--danger-bg);border-color:var(--danger-bd)" role="alert">
        {{ $errors->first() }}
      </div>
    @endif

    @yield('content')
  </main>
</body>
</html>
