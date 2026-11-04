import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayISO } from '@/wizard/calendarDate';

/** Refresh Today after midnight or returning to the app on a different day. */
export function useLocalDay() {
  const [day, setDay] = useState(todayISO);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(timer);
      setDay(todayISO());
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(update, midnight.getTime() - now.getTime() + 100);
    };
    update();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') update(); });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, []);
  return day;
}
