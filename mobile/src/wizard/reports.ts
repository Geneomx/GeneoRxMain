import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { MedEntry } from '@/content/wizardData';
import { buildClinicianSnapshotText, fmtDate, type TranslateFn } from '@/wizard/engine';
import type { WizardState } from '@/wizard/types';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function buildReportHtml(
  snapshot: string,
  checkinIndex: number,
  dateISO: string,
  t: TranslateFn,
): string {
  const title = t('modal.report.doctor_title');
  const label = `${t('checkin.label_n')} ${checkinIndex + 1} · ${fmtDate(dateISO)}`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;line-height:1.45;color:#111}pre{white-space:pre-wrap;font-family:Menlo,monospace;font-size:12px;border:1px solid #ddd;border-radius:12px;padding:16px;background:#fafafa}</style></head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(label)}</p><pre>${escapeHtml(snapshot)}</pre></body></html>`;
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
): Promise<boolean> {
  if (!state.checkins.length) return false;
  const idx =
    typeof checkinIndex === 'number' && checkinIndex >= 0 && checkinIndex < state.checkins.length
      ? checkinIndex
      : state.checkins.length - 1;
  const checkin = state.checkins[idx];
  const snapshot = buildClinicianSnapshotText(state, t, idx, catalog);
  const datePart = checkin?.dateISO ? String(checkin.dateISO).slice(0, 10) : 'report';
  const title = `${t('modal.report.doctor_title')} · ${t('checkin.label_n')} ${idx + 1} · ${fmtDate(checkin.dateISO)}`;
  const filename = `geneorx_report_checkin_${idx + 1}_${datePart}.html`;
  const html = buildReportHtml(snapshot, idx, checkin.dateISO, t);

  try {
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
