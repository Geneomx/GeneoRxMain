import { BASE_MED_DB } from './baseData';
import type { MedDef } from './types';

let resolver: () => MedDef[] = () => BASE_MED_DB;

export function configureMedDbResolver(fn: () => MedDef[]): void {
  resolver = fn;
}

export function getMedDb(): MedDef[] {
  return resolver();
}
