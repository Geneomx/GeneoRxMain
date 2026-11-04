import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { useProfile } from '@/store/ProfileContext';
import { useAuth } from '@/auth/AuthContext';
import { useTranslation } from './useTranslation';
import { useWizard } from '@/store/WizardContext';
import { enablePushNotifications, disablePushNotifications } from '@/notifications/push';

export function useReminderSettings() {
  const { data } = useProfile();
  const { savePayload } = useWizard();
  const { isGuest } = useAuth();
  const { t } = useTranslation();
  const stored = (data?.portal_state?.reminderPreferences as { enabled?: boolean } | undefined)?.enabled === true;
  const [enabled, setEnabled] = useState(stored);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setEnabled(stored); }, [stored]);
  const toggle = async (next: boolean) => {
    if (busy) return;
    if (isGuest) { Alert.alert(t('mobile.reminders.title'), t('parity.sign_in_reminders')); return; }
    setBusy(true);
    try {
      if (next && !(await enablePushNotifications())) {
        Alert.alert(t('mobile.reminders.title'), t(Constants.appOwnership === 'expo' ? 'parity.expo_reminders' : 'mobile.reminders.denied_body'));
        return;
      }
      if (!next) await disablePushNotifications();
      await savePayload({ portal_state: { reminderPreferences: { enabled: next } } });
      setEnabled(next);
    } catch (error) { Alert.alert(t('mobile.profile.save_error_title'), error instanceof Error ? error.message : t('mobile.alert.try_again')); }
    finally { setBusy(false); }
  };
  return { enabled, busy, toggle };
}
