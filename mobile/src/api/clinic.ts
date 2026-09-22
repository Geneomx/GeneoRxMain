import { apiRequest } from './client';
import type { ConsultTurn } from './doctors';

/**
 * The clinician's own side of the app — the same thing /clinic gives them in
 * a browser.
 *
 * Every endpoint is scoped server-side to the signed-in doctor's own
 * directory entry, so another doctor's patient is a 403 rather than a
 * filtered list. A doctor sees who wrote to them and the number that patient
 * gave for a reply; a patient's health record is theirs to share.
 */
export interface ClinicDoctor {
  id: number;
  name: string;
  specialty: string | null;
}

export interface ClinicOverview {
  doctor: ClinicDoctor;
  /** Bookings still waiting on an answer. */
  waiting: number;
  /** Patient turns this doctor has not opened. */
  unread: number;
}

export type ClinicAppointmentStatus = 'requested' | 'confirmed' | 'declined' | 'done';

export interface ClinicAppointment {
  id: number;
  patient: string | null;
  contact_mobile: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  mode: 'chat' | 'call' | 'visit';
  mode_label: string;
  slot_at: string | null;
  slot_date: string | null;
  slot_time: string | null;
  slot_ends: string | null;
  note: string | null;
  status: ClinicAppointmentStatus;
  /** What this doctor last told the patient. */
  response: string | null;
  created_at: string | null;
}

export interface ClinicThread {
  id: number;
  patient: string | null;
  contact_mobile: string | null;
  status: 'new' | 'answered' | 'closed';
  unread: number;
  /** The most recent thing said, for the list. */
  latest: string;
  thread: ConsultTurn[];
  created_at: string | null;
  updated_at: string | null;
}

export function fetchClinicOverview(): Promise<ClinicOverview> {
  return apiRequest('/mobile/clinic/overview');
}

export async function fetchClinicAppointments(): Promise<{
  appointments: ClinicAppointment[];
  waiting: number;
  unread: number;
}> {
  const res = await apiRequest<{ appointments: ClinicAppointment[]; waiting: number; unread: number }>(
    '/mobile/clinic/appointments',
  );
  return { appointments: res.appointments ?? [], waiting: res.waiting ?? 0, unread: res.unread ?? 0 };
}

/** Confirm, decline or finish a booking. Declining frees the time. */
export function respondToAppointment(
  id: number,
  status: 'confirmed' | 'declined' | 'done',
  note?: string | null,
): Promise<{ ok: boolean; appointment: ClinicAppointment }> {
  return apiRequest(`/mobile/clinic/appointments/${id}`, {
    method: 'POST',
    body: { status, admin_note: note || null },
  });
}

export async function fetchClinicThreads(): Promise<{
  threads: ClinicThread[];
  waiting: number;
  unread: number;
}> {
  const res = await apiRequest<{ threads: ClinicThread[]; waiting: number; unread: number }>(
    '/mobile/clinic/messages',
  );
  return { threads: res.threads ?? [], waiting: res.waiting ?? 0, unread: res.unread ?? 0 };
}

/** Opening a conversation is what marks the patient's turns as seen. */
export function markThreadRead(id: number): Promise<{ ok: boolean; unread: number }> {
  return apiRequest(`/mobile/clinic/messages/${id}/read`, { method: 'POST' });
}

/** The server answers 409 if the conversation has since been closed. */
export function replyAsDoctor(id: number, body: string): Promise<{ ok: boolean; thread: ClinicThread }> {
  return apiRequest(`/mobile/clinic/messages/${id}/reply`, { method: 'POST', body: { body } });
}

export function closeThread(id: number): Promise<{ ok: boolean }> {
  return apiRequest(`/mobile/clinic/messages/${id}/close`, { method: 'POST' });
}
