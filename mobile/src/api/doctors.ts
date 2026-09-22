import { apiRequest } from './client';

/**
 * The doctor directory, consult conversations and appointment bookings.
 *
 * Every endpoint requires a signed-in user, unlike feedback: a question
 * addressed to a named clinician needs an account to reply to.
 *
 * The server never sends a doctor's own mobile or email — those are held so an
 * admin can reach them, not published to every account holder. If either ever
 * appears in this type, something has gone wrong server-side.
 */
export interface Doctor {
  id: number;
  name: string;
  specialty: string | null;
  bio: string | null;
  /** ISO weekdays this doctor works: 1 = Monday … 7 = Sunday. */
  available_days: number[];
  /** "09:00" / "17:00", clinic wall-clock. */
  available_from: string | null;
  available_to: string | null;
  /** Length of one appointment. */
  slot_minutes: number;
}

export type DoctorMessageStatus = 'new' | 'answered' | 'closed';

/** One turn in a consult conversation. The opening question is the first. */
export interface ConsultTurn {
  id: number;
  from: 'patient' | 'doctor';
  body: string;
  at: string | null;
}

export interface DoctorMessage {
  id: number;
  doctor: string | null;
  doctor_specialty: string | null;
  body: string;
  status: DoctorMessageStatus;
  /** The whole conversation, oldest first, opening question included. */
  thread: ConsultTurn[];
  /** The newest doctor turn. Kept for older builds; `thread` supersedes it. */
  reply: string | null;
  replied_at: string | null;
  created_at: string | null;
}

export type AppointmentStatus = 'requested' | 'confirmed' | 'declined' | 'done';
export type TimeWindow = 'morning' | 'afternoon' | 'evening';
/** How the appointment happens. */
export type AppointmentMode = 'chat' | 'call' | 'visit';

export interface AppointmentRequest {
  id: number;
  doctor: string | null;
  doctor_specialty: string | null;
  preferred_date: string | null;
  preferred_time: TimeWindow | null;
  mode: AppointmentMode;
  /** The booked slot, clinic wall-clock. Null on a plain request. */
  slot_at: string | null;
  slot_time: string | null;
  slot_ends: string | null;
  note: string | null;
  status: AppointmentStatus;
  /** What the clinic said back — where a moved date or a decline is explained. */
  response: string | null;
  responded_at: string | null;
  created_at: string | null;
}

/** One time on a doctor's grid for a given day. */
export interface Slot {
  /** ISO 8601 start, to send back when booking. */
  at: string;
  /** "09:30" — clinic wall-clock, ready to show. */
  time: string;
  ends: string;
  available: boolean;
  /** Why it cannot be taken: 'past' | 'booked' | null. */
  reason: string | null;
}

export interface DaySlots {
  date: string;
  /** False when the doctor does not work that day at all. */
  open: boolean;
  slots: Slot[];
}

export async function fetchDoctors(): Promise<Doctor[]> {
  const res = await apiRequest<{ doctors: Doctor[] }>('/mobile/doctors');
  return res.doctors ?? [];
}

/** A doctor's times for one day (YYYY-MM-DD), with taken ones marked. */
export async function fetchDoctorSlots(doctorId: number, date: string): Promise<DaySlots> {
  return apiRequest<DaySlots>(`/mobile/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`);
}

export async function fetchDoctorMessages(): Promise<DoctorMessage[]> {
  const res = await apiRequest<{ messages: DoctorMessage[] }>('/mobile/doctor-messages');
  return res.messages ?? [];
}

export function askDoctor(input: {
  doctorId?: number | null;
  body: string;
  contactMobile?: string | null;
}): Promise<{ ok: boolean; id: number }> {
  return apiRequest('/mobile/doctor-messages', {
    method: 'POST',
    body: {
      doctor_id: input.doctorId ?? null,
      body: input.body,
      contact_mobile: input.contactMobile || null,
    },
  });
}

/**
 * A follow-up in an existing conversation. Posting one puts the thread back in
 * the doctor's queue. The server answers 409 for a closed conversation.
 */
export function replyToThread(messageId: number, body: string): Promise<{ ok: boolean; id: number }> {
  return apiRequest(`/mobile/doctor-messages/${messageId}/reply`, {
    method: 'POST',
    body: { body },
  });
}

export async function fetchAppointments(): Promise<AppointmentRequest[]> {
  const res = await apiRequest<{ appointments: AppointmentRequest[] }>('/mobile/appointments');
  return res.appointments ?? [];
}

/**
 * Books a slot on the doctor's grid when `slotAt` is given, or leaves a plain
 * request when it is not.
 *
 * The server answers 409 twice over: once when this patient already has an
 * open request, and once when somebody else took the slot first. Both are
 * worth saying plainly rather than treating as a generic failure — in the
 * first case their existing request is still live, and in the second the
 * times need reloading.
 */
export function requestAppointment(input: {
  doctorId?: number | null;
  slotAt?: string | null;
  mode?: AppointmentMode;
  preferredDate?: string | null;
  preferredTime?: TimeWindow | null;
  note?: string | null;
  contactMobile?: string | null;
}): Promise<{ ok: boolean; id: number }> {
  return apiRequest('/mobile/appointments', {
    method: 'POST',
    body: {
      doctor_id: input.doctorId ?? null,
      slot_at: input.slotAt || null,
      mode: input.mode ?? 'visit',
      preferred_date: input.preferredDate || null,
      preferred_time: input.preferredTime || null,
      note: input.note || null,
      contact_mobile: input.contactMobile || null,
    },
  });
}
