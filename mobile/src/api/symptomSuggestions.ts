import { apiRequest } from './client';
import type { SymptomSuggestion } from '@/wizard/symptomSuggestions';

export interface SymptomSuggestionResult {
  suggestions: SymptomSuggestion[];
  source: 'ai' | 'catalog';
}

export function fetchSymptomSuggestions(medications: string[], signal?: AbortSignal) {
  return apiRequest<SymptomSuggestionResult>('/mobile/symptom-suggestions', {
    method: 'POST', body: { medications }, signal,
  });
}
