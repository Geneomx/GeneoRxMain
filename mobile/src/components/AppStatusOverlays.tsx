import React, { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/components/Toast';
import { onSyncError } from '@/store/syncEvents';

/** Global sync-error toasts only (offline banner is inline in AppTabs). */
export const AppStatusOverlays: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useToast();

  useEffect(() => {
    return onSyncError(() => show(t('mobile.sync.failed'), 'error'));
  }, [show, t]);

  return null;
};
