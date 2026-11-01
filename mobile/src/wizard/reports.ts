import { trackingHealthStory } from './reviewData';
import { trackingRecordText } from './trackingReport';
import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { track } from '@/api/analytics';
import type { MedEntry } from '@/content/wizardData';
import { fmtDate, type TranslateFn } from '@/wizard/engine';
import { buildClinicianSnapshotText } from '@/wizard/trackingReport';
import { MED_DB } from '@/content/wizardData';
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
  aiSummary = '',
): string {
  const title = t('modal.report.doctor_title');
  // Filter empties so a missing date doesn't leave a dangling separator
  const label = [`${t('checkin.label_n')} ${checkinIndex + 1}`, fmtDate(dateISO)]
    .filter(Boolean)
    .join(' · ');
  const dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
  const aiBlock = aiSummary
    ? `<h2 style="font-size:15px;margin-top:24px">${escapeHtml(t('report.ai_summary_title'))}</h2><p style="font-size:11px;color:#666;margin:2px 0 8px">${escapeHtml(t('report.ai_summary_note'))}</p><pre>${escapeHtml(aiSummary)}</pre>`
    : '';
  return `<!doctype html><html lang="${escapeHtml(lang)}" dir="${dir}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;line-height:1.45;color:#111}pre{white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;overflow-x:auto;font-family:Menlo,monospace;font-size:12px;border:1px solid #ddd;border-radius:12px;padding:16px;background:#fafafa}</style></head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(label)}</p><pre>${escapeHtml(snapshot)}</pre>${aiBlock}</body></html>`;
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

/** One selected check-in, using the same record text in preview and exported PDF. */
export function buildTrackingReportText(state: WizardState, t: TranslateFn, index: number, catalog: MedEntry[] = MED_DB): string {
  const checkin = state.checkins[index];
  const filtered = { ...state, checkins: checkin ? [checkin] : [] };
  return trackingRecordText(filtered, trackingHealthStory(filtered, t, catalog), checkin ? fmtDate(checkin.dateISO) : '', t, catalog);
}

export async function downloadDoctorReport(
  state: WizardState,
  t: TranslateFn,
  checkinIndex?: number,
  catalog?: MedEntry[],
  lang = 'en',
): Promise<boolean> {
  if (!state.checkins.length) return false;
  // Tracked here rather than at each call site so both the report picker and
  // the progress screen are covered by one seam. Matches the web portal, which
  // tracks after its own empty-checkins guard.
  track('report_downloaded', { checkins: state.checkins.length });
  const idx =
    typeof checkinIndex === 'number' && checkinIndex >= 0 && checkinIndex < state.checkins.length
      ? checkinIndex
      : state.checkins.length - 1;
  const checkin = state.checkins[idx];
  const snapshot = buildTrackingReportText(state, t, idx, catalog);
  const aiSummary = ''; // Record export stays local; personal cloud summaries require a separate action.
  // Filesystem-safe: this becomes a real file path, so never trust the
  // stored date's shape.
  const rawDate = checkin?.dateISO ? String(checkin.dateISO).slice(0, 10) : 'report';
  const datePart = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : rawDate.replace(/[^0-9A-Za-z_-]/g, '_');
  const title = [t('modal.report.doctor_title'), `${t('checkin.label_n')} ${idx + 1}`, fmtDate(checkin.dateISO)]
    .filter(Boolean)
    .join(' · ');
  const stem = `geneorx_report_checkin_${idx + 1}_${datePart}`;
  const filename = `${stem}.html`;
  const html = buildReportHtml(snapshot, idx, checkin.dateISO, t, lang, aiSummary);

  return shareReportFile(snapshot, html, stem, title, t);
}

/** The exact preview text is used for the selected period's PDF and share fallbacks. */
export async function downloadSummaryReport(snapshot: string, period: string, t: TranslateFn, lang = 'en'): Promise<boolean> {
  const title = t('parity.record_title');
  const dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
  const html = `<!doctype html><html lang="${escapeHtml(lang)}" dir="${dir}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#18232d}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:16px/1.6 Arial,sans-serif}</style></head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(period)}</p><pre>${escapeHtml(snapshot)}</pre></body></html>`;
  return shareReportFile(snapshot, html, `geneorx_summary_${Date.now()}`, title, t);
}

async function shareReportFile(snapshot: string, html: string, stem: string, title: string, t: TranslateFn): Promise<boolean> {
  const filename = `${stem}.html`;

  // A doctor is far more likely to accept a PDF than an .html attachment, so
  // that is tried first. The same HTML feeds the printer, so the report content
  // is identical either way. Every step below degrades rather than failing: PDF
  // -> HTML file -> plain text share.
  try {
    const printed = await Print.printToFileAsync({ html, base64: true });
    // Expo Go scopes sharing to this experience's cache. Native Print can return a global cache URI.
    let uri = printed.uri;
    if (printed.base64 && FileSystem.cacheDirectory) {
      uri = `${FileSystem.cacheDirectory}${stem}.pdf`;
      await FileSystem.writeAsStringAsync(uri, printed.base64, { encoding: FileSystem.EncodingType.Base64 });
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: title,
        UTI: 'com.adobe.pdf',
      });
      return true;
    }
  } catch {
    // expo-print is a native module: on a build that predates it, or if the
    // platform refuses, fall through to the HTML file below.
  }

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
    const result = await Share.share({ title, message: snapshot });
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
