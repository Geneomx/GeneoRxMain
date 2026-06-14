import { useCallback, useMemo } from 'react';
import { translate, type TranslationVars } from '@/content/i18n';
import { useLanguage } from '@/store/LanguageContext';

export function useTranslation() {
  const { language } = useLanguage();
  const code = language.code;

  const t = useCallback(
    (key: string, vars?: TranslationVars) => translate(key, code, vars),
    [code],
  );

  return useMemo(() => ({ t, language: code }), [t, code]);
}
