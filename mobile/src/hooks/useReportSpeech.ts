import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Speech from 'expo-speech';
import { speechChunks } from '@/wizard/reportReading';

/** User-initiated system speech only; closing/changing a report cancels the whole queue. */
export function useReportSpeech(text: string, language: string, enabled: boolean, onError: () => void) {
  const [speaking, setSpeaking] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const generation = useRef(0);
  const active = useRef(false);
  const errorHandler = useRef(onError);
  errorHandler.current = onError;
  const stop = useCallback(() => {
    generation.current += 1;
    const wasActive = active.current;
    active.current = false;
    clearTimer(); setSpeaking(false); setPreparing(false);
    if (wasActive) void Speech.stop().catch(() => undefined);
  }, []);
  useEffect(() => {
    stop();
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') stop(); });
    return () => { subscription.remove(); generation.current += 1; clearTimer(); if (active.current) { active.current = false; void Speech.stop().catch(() => undefined); } };
  }, [text, language, enabled, stop]);

  const start = useCallback(async () => {
    if (!enabled || !text.trim()) return;
    if (active.current) { stop(); return; }
    const version = ++generation.current;
    active.current = true;
    setPreparing(true);
    const failed = () => { if (generation.current === version) { generation.current += 1; active.current = false; clearTimer(); setPreparing(false); setSpeaking(false); void Speech.stop().catch(() => undefined); errorHandler.current(); } };
    timer.current = setTimeout(failed, 20000);
    try {
      await Speech.stop();
      const voices = await Speech.getAvailableVoicesAsync();
      if (generation.current !== version) return;
      const matching = voices.filter(voice => voice.language.toLowerCase().split(/[-_]/)[0] === language.toLowerCase().split(/[-_]/)[0]);
      const voice = matching.find(item => /local|offline/i.test(item.identifier)) || matching[0];
      if (!voice) { failed(); return; }
      const chunks = speechChunks(text, Speech.maxSpeechInputLength);
      const read = (index: number) => {
        if (generation.current !== version) return;
        if (index >= chunks.length) { active.current = false; clearTimer(); setPreparing(false); setSpeaking(false); return; }
        try {
          Speech.speak(chunks[index], { language, voice: voice.identifier, rate: .9, onStart: () => { if (generation.current === version) { clearTimer(); setPreparing(false); setSpeaking(true); } }, onDone: () => read(index + 1), onError: failed, onStopped: () => { if (generation.current === version) { active.current = false; clearTimer(); setPreparing(false); setSpeaking(false); } } });
        } catch { failed(); }
      };
      read(0);
    } catch { failed(); }
  }, [text, language, enabled, stop]);
  return { speaking, preparing, active: speaking || preparing, start, stop };
}
