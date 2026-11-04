jest.mock('react-native', () => ({ Share: { share: jest.fn(), sharedAction: 'sharedAction' } }));
jest.mock('expo-print', () => ({ printToFileAsync: jest.fn() }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(async () => true), shareAsync: jest.fn() }));
jest.mock('expo-file-system/legacy', () => ({ cacheDirectory: 'file:///experience-cache/', EncodingType: { Base64: 'base64', UTF8: 'utf8' }, writeAsStringAsync: jest.fn() }));
jest.mock('@/api/analytics', () => ({ track: jest.fn() }));

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { downloadDoctorReport, downloadSummaryReport } from '../reports';
import { trackingSummaryForRange } from '../trackingReport';
import { MED_DB } from '@/content/wizardData';
import { defaultWizardState } from '../types';
import { translate } from '@/content/i18n';

beforeEach(() => jest.clearAllMocks());

test('an Expo Go PDF is shared from the allowed experience cache rather than the native global cache', async () => {
  (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///global-cache/Print/native.pdf', base64: 'JVBERi0xLjQ=', numberOfPages: 1 });
  const state = defaultWizardState();
  state.checkins = [{ dateISO: '2026-10-27', adherencePct: null, notes: 'Sample', supplementsTaken: [], symptoms: { items: [] }, wellbeing: { energy: 5, mood: 5, sleep: 5, focus: 5 }, sideEffects: [] }];
  await expect(downloadDoctorReport(state, key => translate(key, 'en'), 0)).resolves.toBe(true);
  expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith('file:///experience-cache/geneorx_report_checkin_1_2026-10-27.pdf', 'JVBERi0xLjQ=', { encoding: 'base64' });
  expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///experience-cache/geneorx_report_checkin_1_2026-10-27.pdf', expect.objectContaining({ mimeType: 'application/pdf' }));
  expect(Sharing.shareAsync).toHaveBeenCalledTimes(1);
});

test('a period PDF contains the same dated record as the preview and omits outside notes', async () => {
  (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///cache/summary.pdf', base64: 'PDF' });
  const state = defaultWizardState();
  const record = (dateISO: string, notes: string) => ({ dateISO, notes, adherencePct: null, supplementsTaken: [], symptoms: { items: [] }, wellbeing: { energy: null, mood: null, sleep: null, focus: null }, sideEffects: [] });
  state.checkins = [record('2026-09-01','Outside'), record('2026-10-27','Included note')];
  const t = (key: string) => translate(key, 'en');
  const summary = trackingSummaryForRange(state, '7', t, MED_DB, new Date(2026,9,28));
  await expect(downloadSummaryReport(summary.text, summary.period.label, t)).resolves.toBe(true);
  const html = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
  expect(html).toContain('Included note'); expect(html).not.toContain('Outside');
  expect(html).toContain(summary.period.label); expect(html).not.toMatch(/success probability/i);
});
