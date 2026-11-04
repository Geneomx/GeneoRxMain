import { applyProfileToWizard, applySavePayload, wizardToSavePayload } from '../sync';
import { defaultWizardState } from '../types';
import type { ProfileResponse } from '@/types/api';

const profile = (account: Partial<ProfileResponse['account']>): ProfileResponse => ({
  user: { name: 'A', email: 'a@example.test' },
  profile: null,
  account: { consent: false, email: 'a@example.test', ...account },
  medications: [],
  symptoms: [],
  checkins: [],
} as unknown as ProfileResponse);

describe('personal answers (AI) consent', () => {
  it('starts off, separate from the suggestions consent', () => {
    expect(defaultWizardState().account).toEqual({ email: '', consent: false, aiConsent: false });
  });

  it('is applied when the user turns it on, without touching the other consent', () => {
    const draft = defaultWizardState();
    draft.account.consent = true;
    applySavePayload(draft, { account: { aiConsent: true } });
    expect(draft.account).toMatchObject({ consent: true, aiConsent: true });
    applySavePayload(draft, { account: { aiConsent: false } });
    expect(draft.account).toMatchObject({ consent: true, aiConsent: false });
  });

  it('is read from the server profile and defaults to off when the server does not send it', () => {
    expect(applyProfileToWizard(defaultWizardState(), profile({ aiConsent: true })).account.aiConsent).toBe(true);
    expect(applyProfileToWizard(defaultWizardState(), profile({})).account.aiConsent).toBe(false);
  });

  it('is saved with the rest of the account', () => {
    const state = defaultWizardState();
    state.account.aiConsent = true;
    const payload = wizardToSavePayload(state, []);
    expect(payload.account).toMatchObject({ aiConsent: true });
    expect((payload.portal_state as { account?: { aiConsent?: boolean } }).account?.aiConsent).toBe(true);
  });
});
