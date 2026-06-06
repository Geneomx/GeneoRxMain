import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Per-day medication dose check-offs, keyed by medId. Resets automatically
// on a new local calendar day.
const KEY = 'geneorx.doses';

type DoseState = { date: string; checked: Record<string, boolean> };

function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function useDailyDoses() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const checkedRef = useRef<Record<string, boolean>>({});
  checkedRef.current = checked;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DoseState>;
          if (!cancelled && parsed.date === todayKey() && parsed.checked) {
            setChecked(parsed.checked);
          }
        }
      } catch {
        // ignore — start from an empty set
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback((medId: string) => {
    const next = { ...checkedRef.current, [medId]: !checkedRef.current[medId] };
    setChecked(next);
    AsyncStorage.setItem(KEY, JSON.stringify({ date: todayKey(), checked: next })).catch(() => {});
  }, []);

  return { checked, toggle, ready };
}
