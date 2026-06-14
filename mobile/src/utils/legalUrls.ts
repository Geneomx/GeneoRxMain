import type { AppLanguage } from '@/content/languages';

const BASE = 'https://geneorx.com';

export function legalPrivacyUrl(language: AppLanguage): string {
  return `${BASE}${language.webPath}/legal/privacy`;
}

export function legalTermsUrl(language: AppLanguage): string {
  return `${BASE}${language.webPath}/legal/terms`;
}
