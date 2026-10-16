import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { create } from 'zustand';
import type { LatLng } from '@/types';

/** Colombo Fort — default map centre when we don't know where the user is. */
export const DEFAULT_CENTER: LatLng = { lat: 6.9344, lng: 79.8428 };

export type LocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable';

// Last fix shared across screens so the map doesn't wait for GPS every time.
const useLastFix = create<{ fix: LatLng | null }>(() => ({ fix: null }));
export const useLastKnownLocation = () => useLastFix((s) => s.fix);

/**
 * Asks for foreground location only when `locate()` is called (never on app
 * start). Denied → status 'denied' so screens can show the manual-search fallback.
 */
export function useLocation() {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const fix = useLastFix((s) => s.fix);

  const locate = useCallback(async (): Promise<LatLng | null> => {
    setStatus('locating');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setStatus('denied');
        return null;
      }
      // Fast answer first (last known), then a fresh fix.
      const last = await Location.getLastKnownPositionAsync({ maxAge: 60_000 });
      const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      useLastFix.setState({ fix: ll });
      setStatus('granted');
      return ll;
    } catch {
      setStatus('unavailable');
      return null;
    }
  }, []);

  return { status, location: fix, locate };
}
