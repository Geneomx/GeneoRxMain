import packs from './i18nPacks.json';

export type TranslationVars = Record<string, string | number | undefined | null>;

type Pack = Record<string, string>;

const ALL_PACKS = packs as Record<string, Pack>;
const EN = ALL_PACKS.en ?? {};

export function translate(key: string, lang: string, vars?: TranslationVars): string {
  const pack = ALL_PACKS[lang] ?? EN;
  let str = pack[key] ?? EN[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replaceAll(`{${k}}`, String(v ?? ''));
    });
  }
  return str;
}

export function translateMany(keys: string[], lang: string): string[] {
  return keys.map((key) => translate(key, lang));
}

export function availableLanguages(): string[] {
  return Object.keys(ALL_PACKS);
}
