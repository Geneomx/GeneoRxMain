import { apiRequest } from './client';

/**
 * The doctor directory, async questions and appointment requests.
 *
 * All five endpoints require a signed-in user, unlike feedback: a question
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
}

export type DoctorMessageStatus = 'new' | 'answered' | 'closed';

export interface DoctorMessage {
  id: number;
  doctor: string | null;
  doctor_specialty: string | null;
  body: string;
  status: DoctorMessageStatus;
  /** null until a doctor has answered. */
  reply: string | null;
  replied_at: string | null;
  created_at: string | null;
}

export type AppointmentStatus = 'requested' | 'confirmed' | 'declined' | 'done';
export type TimeWindow = 'morning' | 'afternoon' | 'evening';

export interface AppointmentRequest {
  id: number;
  doctor: string | null;
  doctor_specialty: string | null;
  preferred_date: string | null;
  preferred_time: TimeWindow | null;
  note: string | null;
  status: AppointmentStatus;
  /** What the clinic said back — where a moved date or a decline is explained. */
  response: string | null;
  responded_at: string | null;
  created_at: string | null;
}

export async function fetchDoctors(): Promise<Doctor[]> {
  const res = await apiRequest<{ doctors: Doctor[] }>('/mobile/doctors');
  return res.doctors ?? [];
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

export async function fetchAppointments(): Promise<AppointmentRequest[]> {
  const res = await apiRequest<{ appointments: AppointmentRequest[] }>('/mobile/appointments');
  return res.appointments ?? [];
}

/**
 * Requests an appointment. The server refuses a second open request with 409 —
 * the client should say so rather than treating it as a failure, because the
 * patient's first request is still waiting and that is the useful thing to tell
 * them.
 */
export function requestAppointment(input: {
  doctorId?: number | null;
  preferredDate?: string | null;
  preferredTime?: TimeWindow | null;
  note?: string | null;
  contactMobile?: string | null;
}): Promise<{ ok: boolean; id: number }> {
  return apiRequest('/mobile/appointments', {
    method: 'POST',
    body: {
      doctor_id: input.doctorId ?? null,
      preferred_date: input.preferredDate || null,
      preferred_time: input.preferredTime || null,
      note: input.note || null,
      contact_mobile: input.contactMobile || null,
    },
  });
}
