import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { track } from '@/api/analytics';
import type { MedEntry } from '@/content/wizardData';
import { buildClinicianSnapshotText, computeInsightEngine, fmtDate, type TranslateFn } from '@/wizard/engine';
import { MED_DB } from '@/content/wizardData';
import { fetchAiSummary } from '@/api/aiSummary';
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

/**
 * AI visit summary (overview + meaning + clinician questions) for the doctor
 * report. Returns '' on any failure / when no key is configured, so the report
 * always generates either way.
 */
async function fetchVisitSummary(
  state: WizardState,
  t: TranslateFn,
  catalog: MedEntry[] | undefined,
  lang: string,
): Promise<string> {
  try {
    const db = catalog?.length ? catalog : MED_DB;
    const insight = computeInsightEngine(state, t, catalog);
    const meds = state.meds.map((m) => db.find((x) => x.id === m.medId)?.name ?? m.medId);
    const res = await fetchAiSummary({
      medications: meds,
      symptoms: state.symptoms.selected ?? [],
      summary: insight.summary,
      meaning: insight.meaning,
      doctorPrompt: insight.doctorPrompt,
      language: lang,
    });
    return res.source === 'ai' && res.summary ? res.summary : '';
  } catch {
    return '';
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
  // Tracked here rather than at each call site so both the report picker and
  // the progress screen are covered by one seam. Matches the web portal, which
  // tracks after its own empty-checkins guard.
  track('report_downloaded', { checkins: state.checkins.length });
  const idx =
    typeof checkinIndex === 'number' && checkinIndex >= 0 && checkinIndex < state.checkins.length
      ? checkinIndex
      : state.checkins.length - 1;
  const checkin = state.checkins[idx];
  const snapshot = buildClinicianSnapshotText(state, t, idx, catalog);
  const aiSummary = await fetchVisitSummary(state, t, catalog, lang);
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

  // A doctor is far more likely to accept a PDF than an .html attachment, so
  // that is tried first. The same HTML feeds the printer, so the report content
  // is identical either way. Every step below degrades rather than failing: PDF
  // -> HTML file -> plain text share.
  try {
    const { uri } = await Print.printToFileAsync({ html });
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
    const shareText = aiSummary ? `${snapshot}

${t('report.ai_summary_title')}
${aiSummary}` : snapshot;
    const result = await Share.share({ title: `${title} (${datePart})`, message: shareText });
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
