import { apiRequest } from './client';

/**
 * Feedback types the server accepts. The validator is case-sensitive
 * (`in:bug,suggestion,question,other`), while the UI labels are capitalised —
 * always pass values through `toFeedbackType()` rather than the raw label.
 */
export type FeedbackType = 'bug' | 'suggestion' | 'question' | 'other';

const FEEDBACK_TYPES: readonly FeedbackType[] = ['bug', 'suggestion', 'question', 'other'];

export function toFeedbackType(label: string): FeedbackType {
  const normalized = label.trim().toLowerCase();

  return (FEEDBACK_TYPES as readonly string[]).includes(normalized)
    ? (normalized as FeedbackType)
    : 'other';
}

export interface FeedbackPayload {
  type: FeedbackType;
  message: string;
  canContact: boolean;
  /** Only sent for guests; must be a real address or omitted entirely. */
  contactEmail?: string | null;
}

/**
 * POST /api/feedback — reaches the admin feedback inbox.
 *
 * The bearer token is attached automatically when the user is signed in, and
 * the endpoint is guest-friendly, so this works either way.
 */
export function sendFeedback(payload: FeedbackPayload) {
  const email = payload.contactEmail?.trim();

  return apiRequest<{ ok: boolean }>('/feedback', {
    method: 'POST',
    body: {
      type: payload.type,
      message: payload.message,
      can_contact: payload.canContact,
      // The server rejects anything that is not a valid email, so send null
      // rather than a placeholder like "Anonymous".
      contact_email: email && email.includes('@') ? email : null,
      source: 'mobile',
    },
  });
}
