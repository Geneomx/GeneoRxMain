import { translate } from './i18n';

export { translate };

export function translateMany(keys: string[], lang: string): string[] {
  return keys.map((key) => translate(key, lang));
}
