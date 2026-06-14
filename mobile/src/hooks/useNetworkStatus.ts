import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus(): { online: boolean; ready: boolean } {
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const apply = (state: NetInfoState) => {
      if (!mounted) return;
      const connected = state.isConnected !== false && state.isInternetReachable !== false;
      setOnline(connected);
      setReady(true);
    };
    const unsub = NetInfo.addEventListener(apply);
    void NetInfo.fetch().then(apply);
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return { online, ready };
}
