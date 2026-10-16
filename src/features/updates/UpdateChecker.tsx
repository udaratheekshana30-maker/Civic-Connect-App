import { useEffect } from 'react';
import * as Updates from 'expo-updates';

/**
 * On launch: if EAS Update has a newer JS bundle, download it and reload right
 * away (default behaviour only applies it on the *next* cold start).
 * No-op in development and in builds without expo-updates.
 */
export function UpdateChecker() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (!check.isAvailable) return;
        const res = await Updates.fetchUpdateAsync();
        if (res.isNew) await Updates.reloadAsync();
      } catch {
        // offline or server unreachable: try again next launch
      }
    })();
  }, []);
  return null;
}
