import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { MedEntry } from '@/content/wizardData';
import { buildClinicianSnapshotText, fmtDate, type TranslateFn } from '@/wizard/engine';
import type { WizardState } from '@/wizard/types';

const RTL_LANGS = new Set(['ar', 'ur']);

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildReportHtml(
  snapshot: string,
  checkinIndex: number,
  dateISO: string,
  t: TranslateFn,
  lang = 'en',
): string {
  const title = t('modal.report.doctor_title');
  // Filter empties so a missing date doesn't leave a dangling separator
  const label = [`${t('checkin.label_n')} ${checkinIndex + 1}`, fmtDate(dateISO)]
    .filter(Boolean)
    .join(' · ');
  const dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
  return `<!doctype html><html lang="${escapeHtml(lang)}" dir="${dir}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;line-height:1.45;color:#111}pre{white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;overflow-x:auto;font-family:Menlo,monospace;font-size:12px;border:1px solid #ddd;border-radius:12px;padding:16px;background:#fafafa}</style></head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(label)}</p><pre>${escapeHtml(snapshot)}</pre></body></html>`;
}

export async function shareClinicianSnapshot(
  state: WizardState,
  t: TranslateFn,
  options?: { checkinIndex?: number; catalog?: MedEntry[]; title?: string },
): Promise<boolean> {
  const message = buildClinicianSnapshotText(state, t, options?.checkinIndex, options?.catalog);
  try {
    const result = await Share.share({
      title: options?.title ?? t('portal.share'),
      message,
    });
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}

export async function downloadDoctorReport(
  state: WizardState,
  t: TranslateFn,
  checkinIndex?: number,
  catalog?: MedEntry[],
  lang = 'en',
): Promise<boolean> {
  if (!state.checkins.length) return false;
  const idx =
    typeof checkinIndex === 'number' && checkinIndex >= 0 && checkinIndex < state.checkins.length
      ? checkinIndex
      : state.checkins.length - 1;
  const checkin = state.checkins[idx];
  const snapshot = buildClinicianSnapshotText(state, t, idx, catalog);
  // Filesystem-safe: this becomes a real file path, so never trust the
  // stored date's shape.
  const rawDate = checkin?.dateISO ? String(checkin.dateISO).slice(0, 10) : 'report';
  const datePart = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : rawDate.replace(/[^0-9A-Za-z_-]/g, '_');
  const title = [t('modal.report.doctor_title'), `${t('checkin.label_n')} ${idx + 1}`, fmtDate(checkin.dateISO)]
    .filter(Boolean)
    .join(' · ');
  const filename = `geneorx_report_checkin_${idx + 1}_${datePart}.html`;
  const html = buildReportHtml(snapshot, idx, checkin.dateISO, t, lang);

  try {
    if (!FileSystem.cacheDirectory) throw new Error('No cache directory available');
    const path = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(path, html, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'text/html',
        dialogTitle: title,
        UTI: 'public.html',
      });
      return true;
    }
  } catch {
    // fall through to plain-text share
  }

  try {
    const result = await Share.share({ title: `${title} (${datePart})`, message: snapshot });
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
