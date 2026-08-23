import { apiRequest } from './client';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantContext {
  medications?: string[];
  symptoms?: string[];
}

export interface AssistantResult {
  reply: string | null;
  /** 'ai' when the model replied; 'unavailable' when no key is configured. */
  source: 'ai' | 'unavailable';
}

/**
 * Ask GeneoRx. Sends the turn history (oldest-first, last turn must be the
 * user's) and, for guests, a minimal context; signed-in users are grounded
 * server-side from their own records. The reply already carries the
 * "not medical advice" disclaimer.
 */
export function askAssistant(
  messages: AssistantMessage[],
  opts: { context?: AssistantContext; language?: string } = {},
): Promise<AssistantResult> {
  return apiRequest<AssistantResult>('/mobile/assistant', {
    method: 'POST',
    body: {
      messages,
      context: opts.context,
      language: opts.language ?? 'en',
    },
  });
}
