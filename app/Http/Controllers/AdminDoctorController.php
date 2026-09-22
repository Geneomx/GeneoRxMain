<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\AppointmentRequest;
use App\Models\ConsultMessage;
use App\Models\Doctor;
use App\Models\DoctorMessage;
use App\Models\User;
use App\Support\ConsultAlerts;
use App\Support\ConsultChat;
use App\Support\DoctorSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Doctor registration and the consult inbox. Admin only.
 *
 * Doctors are registered here and nowhere else — there is no self-registration
 * route, because listing someone as a clinician is a claim the business makes on
 * their behalf. Every write is recorded in the audit log for the same reason.
 *
 * Replies are typed by an admin and attributed to the doctor. `replied_by`
 * records which admin account actually wrote it, so the attribution stays
 * honest internally even though the patient sees the doctor's name.
 */
class AdminDoctorController extends Controller
{
    /** Same rule as AdminController: the support role is read-only. */
    private function requireWrite(): void
    {
        abort_unless(auth()->user()->canWriteAdmin(), 403, 'Support role is read-only.');
    }

    // ── Directory ──────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = Doctor::withCount(['messages', 'appointmentRequests'])->orderBy('name');

        if ($request->input('status') === 'active') {
            $query->where('is_active', true);
        } elseif ($request->input('status') === 'inactive') {
            $query->where('is_active', false);
        }

        $doctors = $query->paginate(25)->withQueryString();

        $counts = [
            'active' => Doctor::where('is_active', true)->count(),
            'inactive' => Doctor::where('is_active', false)->count(),
        ];

        return view('admin.doctors', compact('doctors', 'counts'));
    }

    /**
     * The registration form's rules. Availability is optional on the wire and
     * defaults to Mon–Fri, 09:00–17:00, 30 minutes per patient, so a doctor is
     * bookable from the moment they are listed.
     *
     * @return array<string, array<int, string>>
     */
    private static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'specialty' => ['nullable', 'string', 'max:120'],
            'mobile' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'available_days' => ['nullable', 'array', 'min:1'],
            'available_days.*' => ['integer', 'between:1,7'],
            'available_from' => ['nullable', 'date_format:H:i'],
            'available_to' => ['nullable', 'date_format:H:i', 'after:available_from'],
            'slot_minutes' => ['nullable', 'integer', 'between:5,180'],
        ];
    }

    /**
     * Availability as it is stored: days as "1,2,3", and the defaults wherever
     * the form sent nothing.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private static function withAvailability(array $data): array
    {
        $days = array_map('intval', (array) ($data['available_days'] ?? DoctorSchedule::DEFAULT_DAYS));
        $days = array_values(array_unique($days));
        sort($days);

        $data['available_days'] = implode(',', $days);
        $data['available_from'] = $data['available_from'] ?? DoctorSchedule::DEFAULT_FROM;
        $data['available_to'] = $data['available_to'] ?? DoctorSchedule::DEFAULT_TO;
        $data['slot_minutes'] = (int) ($data['slot_minutes'] ?? DoctorSchedule::DEFAULT_SLOT_MINUTES);

        return $data;
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireWrite();

        $data = self::withAvailability($request->validate(self::rules()));

        $doctor = Doctor::create($data + [
            'is_active' => true,
            'created_by' => $request->user()->id,
        ]);

        // Name only in the audit payload — the clinician's mobile and email do
        // not need to be duplicated into a log that is read far more often.
        AdminAuditLog::record('doctor.created', $doctor, [
            'name' => $doctor->name,
            'specialty' => $doctor->specialty,
        ], 'Doctor '.$doctor->name);

        return back()->with('success', "{$doctor->name} added to the directory.");
    }

    public function update(Request $request, Doctor $doctor): RedirectResponse
    {
        $this->requireWrite();

        $data = self::withAvailability($request->validate(self::rules()));

        $doctor->update($data);

        AdminAuditLog::record('doctor.updated', $doctor, [
            'name' => $doctor->name,
        ], 'Doctor '.$doctor->name);

        return back()->with('success', "{$doctor->name} updated.");
    }

    /**
     * Deactivate rather than delete. An inactive doctor takes no new questions
     * but their existing answers stay attached to the patient's history, so
     * nobody's record develops a hole.
     */
    public function toggleActive(Request $request, Doctor $doctor): RedirectResponse
    {
        $this->requireWrite();

        $doctor->update(['is_active' => ! $doctor->is_active]);
        $state = $doctor->is_active ? 'active' : 'inactive';

        AdminAuditLog::record('doctor.'.$state, $doctor, [
            'name' => $doctor->name,
        ], 'Doctor '.$doctor->name);

        return back()->with('success', "{$doctor->name} is now {$state}.");
    }

    /**
     * Give a doctor a sign-in for the clinic portal.
     *
     * The admin never sees or sets the password: the account is created (or an
     * existing one with that address is linked) and the clinician chooses
     * their own password from an emailed link. Their email is treated as
     * verified because an admin vouching for a clinician is the whole point of
     * there being no self-registration.
     */
    public function createLogin(Request $request, Doctor $doctor): RedirectResponse
    {
        $this->requireWrite();

        if (blank($doctor->email)) {
            return back()->with('error', "Add an email address for {$doctor->name} first — that is where the sign-in link goes.");
        }

        if ($doctor->hasLogin()) {
            PasswordController::issueResetLink($doctor->user);

            return back()->with('success', "Sign-in link sent to {$doctor->email} again.");
        }

        $user = User::where('email', $doctor->email)->first();

        if (! $user) {
            $user = User::create([
                'name' => $doctor->name,
                'email' => $doctor->email,
                // Never used: the clinician sets their own from the link.
                'password' => Str::random(48),
                'email_verified_at' => now(),
            ]);
        } elseif (Doctor::where('user_id', $user->id)->exists()) {
            return back()->with('error', "{$doctor->email} already signs in as another doctor.");
        }

        $doctor->update(['user_id' => $user->id]);
        PasswordController::issueResetLink($user);

        AdminAuditLog::record('doctor.login_created', $doctor, [
            'name' => $doctor->name,
        ], 'Doctor '.$doctor->name);

        return back()->with('success', "{$doctor->name} can now sign in. A link to choose a password has gone to {$doctor->email}.");
    }

    /** Take away portal access without touching the directory listing. */
    public function revokeLogin(Request $request, Doctor $doctor): RedirectResponse
    {
        $this->requireWrite();

        $doctor->update(['user_id' => null]);

        AdminAuditLog::record('doctor.login_revoked', $doctor, [
            'name' => $doctor->name,
        ], 'Doctor '.$doctor->name);

        return back()->with('success', "{$doctor->name} can no longer sign in to the clinic portal.");
    }

    // ── Consult inbox ──────────────────────────────────────────────────────

    public function inbox(Request $request)
    {
        $messageQuery = DoctorMessage::with(['user', 'doctor'])->latest();
        if ($status = $request->input('status')) {
            $messageQuery->where('status', $status);
        }
        $messages = $messageQuery->paginate(20, ['*'], 'messages')->withQueryString();

        $appointments = AppointmentRequest::with(['user', 'doctor'])
            ->latest()
            ->paginate(20, ['*'], 'appointments')
            ->withQueryString();

        $counts = [
            'new' => DoctorMessage::where('status', 'new')->count(),
            'answered' => DoctorMessage::where('status', 'answered')->count(),
            'requested' => AppointmentRequest::where('status', 'requested')->count(),
        ];

        $doctors = Doctor::active()->orderBy('name')->get();

        return view('admin.consults', compact('messages', 'appointments', 'counts', 'doctors'));
    }

    public function reply(Request $request, DoctorMessage $message): RedirectResponse
    {
        $this->requireWrite();

        $data = $request->validate([
            'reply_body' => ['required', 'string', 'max:4000'],
            // A reply can name the doctor it came from even if the patient asked
            // "any doctor", which is the common case.
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
        ]);

        // Attributed to the doctor, typed by this admin. Goes through the
        // same chat seam as the doctor's own portal so the patient sees one
        // conversation rather than two mechanisms.
        $message->update(['doctor_id' => ($data['doctor_id'] ?? null) ?: $message->doctor_id]);
        ConsultChat::post($message, ConsultMessage::DOCTOR, $request->user(), $data['reply_body']);

        // The reply text is patient health information, so it is deliberately
        // NOT written into the audit payload — only the fact of a reply.
        AdminAuditLog::record('doctor_message.replied', $message, [
            'doctor_id' => $message->doctor_id,
        ], 'Message #'.$message->id);

        return back()->with('success', "Replied to message #{$message->id}.");
    }

    public function closeMessage(Request $request, DoctorMessage $message): RedirectResponse
    {
        $this->requireWrite();

        $message->update(['status' => 'closed']);

        AdminAuditLog::record('doctor_message.closed', $message, [], 'Message #'.$message->id);

        return back()->with('success', "Message #{$message->id} closed.");
    }

    public function respondAppointment(Request $request, AppointmentRequest $appointment): RedirectResponse
    {
        $this->requireWrite();

        $data = $request->validate([
            'status' => ['required', 'in:confirmed,declined,done'],
            // Where "Tuesday at 3 instead?" goes. The patient sees this, so a
            // declined request without a note would be a dead end.
            'admin_note' => ['nullable', 'string', 'max:2000'],
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
        ]);

        $appointment->update([
            'status' => $data['status'],
            'admin_note' => $data['admin_note'] ?? $appointment->admin_note,
            'doctor_id' => ($data['doctor_id'] ?? null) ?: $appointment->doctor_id,
            'responded_at' => now(),
        ]);

        ConsultAlerts::bookingDecision($appointment->fresh(), $data['status']);

        AdminAuditLog::record('appointment.'.$data['status'], $appointment, [
            'doctor_id' => $appointment->doctor_id,
        ], 'Appointment #'.$appointment->id);

        return back()->with('success', "Appointment #{$appointment->id} marked {$data['status']}.");
    }
}
