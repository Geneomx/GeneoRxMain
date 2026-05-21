@extends('layouts.app')

@section('content')
<div class="card">
  <div class="hd">
    <div>
      <h2>GeneoRx Billing</h2>
      <p class="desc">Start free, then upgrade to Plus when you want full tracking, exports, reminders, and advanced progress trends.</p>
    </div>
    <span class="badge"><strong>Subscription:</strong> {{ $subscription['plan'] === 'plus' ? 'Plus' : 'Free' }}</span>
  </div>
  <div class="bd">
    @if ($errors->any())
      <div class="banner">
        @foreach ($errors->all() as $error)
          <div>{{ $error }}</div>
        @endforeach
      </div>
    @endif

    @if (request('checkout') === 'success')
      <div class="tagline"><strong>Checkout complete.</strong><br>Stripe is confirming your Plus access. Refresh shortly if the plan badge has not updated yet.</div>
    @elseif (request('checkout') === 'cancel')
      <div class="banner">Checkout was canceled. Your Free plan is still available.</div>
    @endif

    @if (request('feature'))
      <div class="tagline" style="margin-top:14px">
        <strong>Why you are seeing this</strong><br>
        @switch(request('feature'))
          @case('checkins')
          @case('third_checkin')
            Plus unlocks ongoing weekly check-ins after the Free starter limit.
            @break
          @case('doctor_export')
            Plus unlocks the exportable doctor report while Free users can still view the in-app snapshot.
            @break
          @case('reminder_schedule')
            Plus unlocks reminder scheduling for weekly check-ins.
            @break
          @default
            This feature is included with GeneoRx Plus.
        @endswitch
      </div>
    @endif

    <div class="metricGrid" style="margin-top:14px">
      <div class="metricCard">
        <div class="k">Free</div>
        <div class="v">
          Basic insight, email verification, medications, symptoms, and up to {{ $subscription['features']['maxFreeCheckins'] }} check-ins.
        </div>
      </div>
      <div class="metricCard">
        <div class="k">Plus</div>
        <div class="v">
          Unlimited check-ins, full doctor report export, push reminder scheduling, insight history, advanced trends, and priority support.
        </div>
      </div>
      <div class="metricCard">
        <div class="k">Status</div>
        <div class="v">
          {{ ucfirst($subscription['status']) }}
          @if ($subscription['isTrialing'] && $subscription['trialEndsAt'])
            <br>Trial ends {{ \Carbon\Carbon::parse($subscription['trialEndsAt'])->toFormattedDateString() }}
          @endif
          @if ($subscription['isGrace'] && $subscription['graceEndsAt'])
            <br>Payment grace ends {{ \Carbon\Carbon::parse($subscription['graceEndsAt'])->toFormattedDateString() }}
          @endif
          @if ($subscription['canceledAt'] && $subscription['currentPeriodEndsAt'])
            <br>Cancels on {{ \Carbon\Carbon::parse($subscription['currentPeriodEndsAt'])->toFormattedDateString() }}
          @endif
        </div>
      </div>
    </div>

    <div class="btns">
      @if (! $subscription['isPlus'])
        <form method="POST" action="{{ route('billing.checkout') }}">
          @csrf
          <input type="hidden" name="source" value="billing">
          <button class="primary" type="submit">Upgrade to Plus</button>
        </form>
      @endif
      @if ($hasBillingPortal)
        <form method="POST" action="{{ route('billing.portal') }}">
          @csrf
          <button class="ghost" type="submit">Manage billing</button>
        </form>
      @else
        <span class="badge">Billing portal appears after your first Stripe checkout.</span>
      @endif
      <a href="{{ route('treatments') }}" class="ghost" style="text-decoration:none;padding:11px 14px;border-radius:12px;">Back to portal</a>
    </div>

    <div class="fineprint" style="margin-top:16px">
      Educational guidance only. GeneoRx does not diagnose, treat, or replace clinician advice.
      Review Terms, Privacy, and refund/cancellation details before subscribing.
    </div>
  </div>
</div>
@endsection
