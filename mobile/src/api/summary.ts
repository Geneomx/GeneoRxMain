import { apiRequest } from './client';

export interface AiSummaryPayload {
  medications: string[];
  symptoms: string[];
  summary: string;
  meaning: string;
  doctor_prompt: string;
  language?: string;
}

export interface AiSummaryResponse {
  summary: string | null;
  source: 'ai' | 'fallback';
}

export function fetchAiSummary(payload: AiSummaryPayload) {
  return apiRequest<AiSummaryResponse>('/mobile/ai-summary', {
    method: 'POST',
    body: payload,
    authenticated: false,
  });
}
