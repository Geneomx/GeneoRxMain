import { apiRequest } from './client';

/**
 * AI Weekly Digest / summary. Sends the rule-engine's own output as grounding
 * facts and gets back either an AI-written prose narrative (`source: 'ai'`) or,
 * when no key is configured / the model is unavailable, the deterministic
 * engine text (`source: 'fallback'`). Callers should render the returned
 * `summary` when `source === 'ai'` and otherwise keep their existing rule text.
 *
 * The server guarantees the "not medical advice" disclaimer is present, so the
 * client does not need to append one.
 */
export interface AiSummaryFacts {
  medications: string[];
  symptoms: string[];
  summary: string;
  meaning: string;
  doctorPrompt?: string;
  language?: string;
}

export interface AiSummaryResult {
  summary: string | null;
  source: 'ai' | 'fallback';
}

export function fetchAiSummary(facts: AiSummaryFacts): Promise<AiSummaryResult> {
  return apiRequest<AiSummaryResult>('/mobile/ai-summary', {
    method: 'POST',
    body: {
      medications: facts.medications,
      symptoms: facts.symptoms,
      summary: facts.summary,
      meaning: facts.meaning,
      doctor_prompt: facts.doctorPrompt ?? '',
      language: facts.language ?? 'en',
    },
  });
}
