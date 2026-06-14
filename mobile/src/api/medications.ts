import { apiRequest } from './client';
import type { MedEntry } from '@/content/wizardData';

export function fetchMedicationCatalog() {
  return apiRequest<{ catalog: MedEntry[] }>('/medications/catalog', { method: 'GET', authenticated: false });
}
