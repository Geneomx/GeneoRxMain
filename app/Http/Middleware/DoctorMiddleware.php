<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The clinic portal is for a signed-in clinician with an active directory
 * entry. A deactivated doctor loses access along with their listing — their
 * past answers stay with the patient, but they stop seeing new ones.
 */
class DoctorMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $doctor = $request->user()?->doctorProfile;

        if (! $doctor || ! $doctor->is_active) {
            abort(403, 'Clinic access is for registered doctors.');
        }

        return $next($request);
    }
}
