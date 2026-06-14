export type AppLanguage = {
  code: string;
  label: string;
  nativeLabel: string;
  webPath: string;
};

export const APP_LANGUAGES: AppLanguage[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', webPath: '' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', webPath: '/es' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', webPath: '/fr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', webPath: '/ar' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', webPath: '/ur' },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili', webPath: '/sw' },
];

export const DEFAULT_LANGUAGE_CODE = 'en';

export function findLanguage(code: string | null | undefined): AppLanguage {
  return APP_LANGUAGES.find((l) => l.code === code) ?? APP_LANGUAGES[0];
}
