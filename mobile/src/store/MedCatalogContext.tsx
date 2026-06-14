import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMedicationCatalog } from '@/api/medications';
import { MED_DB as FALLBACK_MED_DB, type MedEntry } from '@/content/wizardData';

interface MedCatalogContextValue {
  catalog: MedEntry[];
  hydrated: boolean;
  refresh: () => Promise<void>;
  mergeCustomMeds: (entries: MedEntry[]) => void;
}

const MedCatalogContext = createContext<MedCatalogContextValue | undefined>(undefined);

function mergeCatalog(base: MedEntry[], extras: MedEntry[]): MedEntry[] {
  const map = new Map<string, MedEntry>();
  for (const m of base) map.set(m.id, m);
  for (const m of extras) {
    if (m?.id && !map.has(m.id)) map.set(m.id, m);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const MedCatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalog, setCatalog] = useState<MedEntry[]>(FALLBACK_MED_DB);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetchMedicationCatalog();
      if (res.catalog?.length) {
        setCatalog((prev) => mergeCatalog(res.catalog, prev.filter((m) => String(m.id).includes('custom'))));
      }
    } catch {
      setCatalog((prev) => (prev.length ? prev : FALLBACK_MED_DB));
    } finally {
      setHydrated(true);
    }
  }, []);

  const mergeCustomMeds = useCallback((entries: MedEntry[]) => {
    if (!entries.length) return;
    setCatalog((prev) => mergeCatalog(prev, entries));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ catalog, hydrated, refresh, mergeCustomMeds }),
    [catalog, hydrated, refresh, mergeCustomMeds],
  );

  return <MedCatalogContext.Provider value={value}>{children}</MedCatalogContext.Provider>;
};

export function useMedCatalog(): MedCatalogContextValue {
  const ctx = useContext(MedCatalogContext);
  if (!ctx) throw new Error('useMedCatalog must be used within a MedCatalogProvider');
  return ctx;
}

export function findMedName(catalog: MedEntry[], id: string): string {
  const m = catalog.find((x) => x.id === id);
  return m ? m.name : id.replace(/^custom:/, '').replace(/-/g, ' ');
}
