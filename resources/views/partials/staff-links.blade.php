{{-- Admin and Clinic shortcuts for the dark portal bars.

     Neither used to appear anywhere a signed-in user actually lands: an admin
     is sent to the portal after signing in, and the only link to /admin lived
     in the light layout behind Account settings — so reaching the panel meant
     typing the URL. A doctor had the same problem with /clinic.

     Never shown to a patient, and never in a guest demo session. --}}
@auth
  @unless(session('is_web_guest'))
    @if(auth()->user()->isDoctor())
      <a href="{{ route('clinic.appointments') }}" class="ghost mini portal-link-btn portal-staff-btn" data-i18n="portal.clinic">Clinic</a>
    @endif
    @if(auth()->user()->is_admin ?? false)
      <a href="{{ route('admin.dashboard') }}" class="ghost mini portal-link-btn portal-staff-btn" data-i18n="portal.admin">Admin</a>
    @endif
  @endunless
@endauth
