export type AppLanguage = {
  code: string;
  label: string;
  nativeLabel: string;
  webPath: string;
  /**
   * Whether the language is complete enough to offer. Kept in sync with
   * resources/data/languages.php — ar/ur/sw are gated until their packs
   * (including engine.* keys) are translated.
   */
  enabled: boolean;
};

export const APP_LANGUAGES: AppLanguage[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', webPath: '', enabled: true },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', webPath: '/es', enabled: true },
  { code: 'fr', label: 'French', nativeLabel: 'Français', webPath: '/fr', enabled: true },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', webPath: '/ar', enabled: false },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', webPath: '/ur', enabled: false },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili', webPath: '/sw', enabled: false },
];

/** Languages offered in the picker. */
export const ENABLED_LANGUAGES: AppLanguage[] = APP_LANGUAGES.filter((l) => l.enabled);

export const DEFAULT_LANGUAGE_CODE = 'en';

export function findLanguage(code: string | null | undefined): AppLanguage {
  return APP_LANGUAGES.find((l) => l.code === code) ?? APP_LANGUAGES[0];
}

export function isLanguageEnabled(code: string | null | undefined): boolean {
  return APP_LANGUAGES.some((l) => l.code === code && l.enabled);
}
