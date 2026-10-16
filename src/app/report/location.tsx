import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Hand, LocateFixed, MapPin, Search, Settings } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { OSMMap, type OSMMapHandle } from '@/components/map/OSMMap';
import { PlaceSearch } from '@/components/map/PlaceSearch';
import { Button, Card, IconButton, Stepper, Txt } from '@/components/ui';
import { colors, shadows } from '@/constants/theme';
import { useDraft } from '@/features/report-draft/store';
import { DEFAULT_CENTER, useLastKnownLocation, useLocation } from '@/hooks/useLocation';
import { reverseGeocode } from '@/services/geocoding';
import type { LatLng } from '@/types';

export default function ReportLocation() {
  const { t } = useTranslation();
  const map = useRef<OSMMapHandle>(null);
  const { location, update } = useDraft();
  const lastFix = useLastKnownLocation();
  const { locate, status } = useLocation();
  const [initial] = useState<LatLng>(location ?? lastFix ?? DEFAULT_CENTER);
  const [moved, setMoved] = useState(!!location);
  const [resolving, setResolving] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const pending = useRef(0);

  /** Pin moved → save coordinates now, fill in the address when Nominatim answers. */
  const placeAt = async (p: LatLng, knownAddress?: { address: string; area?: string }) => {
    const ticket = ++pending.current;
    if (knownAddress) {
      update({ location: { ...p, ...knownAddress } });
      setGeoError(false);
      return;
    }
    update({ location: { ...p, address: location?.address ?? '', area: location?.area } });
    setResolving(true);
    setGeoError(false);
    try {
      const place = await reverseGeocode(p.lat, p.lng);
      if (ticket === pending.current) update({ location: place });
    } catch {
      if (ticket === pending.current) setGeoError(true);
    } finally {
      if (ticket === pending.current) setResolving(false);
    }
  };

  const useMine = async () => {
    const ll = await locate();
    if (ll) {
      map.current?.flyTo(ll, 18);
      setMoved(true);
      placeAt(ll);
    }
  };

  // First visit: try GPS straight away (asks permission once).
  useEffect(() => {
    if (!location) useMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const denied = status === 'denied';
  const address = location?.address || (location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : '');

  return (
    <Screen
      title={t('report.title')}
      header={<Stepper step={3} />}
      contentContainerClassName="pb-6"
      footer={<Button full label={t('common.next')} disabled={!location} onPress={() => router.push('/report/review')} />}
    >
      <View style={{ height: 300 }}>
        <OSMMap
          ref={map}
          initialCenter={initial}
          initialZoom={location ? 18 : 16}
          pickMode
          user={lastFix}
          onMoveEnd={(e) => {
            if (!e.byUser) return; // programmatic moves are handled where they happen
            setMoved(true);
            placeAt({ lat: e.lat, lng: e.lng });
          }}
          className="flex-1"
          accessibilityLabel={t('location.mapA11y')}
        />
        <View className="absolute inset-x-0 top-3 items-center" pointerEvents="none">
          <View className="flex-row items-center gap-2 rounded-full bg-ink/85 px-3.5 py-2">
            <Hand size={16} color={colors.white} />
            <Txt variant="caption" weight="medium" className="text-white">
              {moved ? t('location.hintMoved') : t('location.hint')}
            </Txt>
          </View>
        </View>
        <View className="absolute bottom-6 right-3">
          <IconButton icon={LocateFixed} color={colors.primary} accessibilityLabel={t('location.useMine')} onPress={useMine} className="bg-white" style={shadows.card} />
        </View>
      </View>

      <View className="gap-4 px-4 py-4">
        {denied && !location ? (
          <Card className="items-center">
            <Image source={require('../../../assets/images/location-denied.jpg')} style={{ width: 140, height: 140, borderRadius: 20 }} accessibilityIgnoresInvertColors />
            <Txt variant="h2" className="mt-4 text-center">
              {t('location.deniedTitle')}
            </Txt>
            <Txt variant="bodySm" className="mt-1 text-center text-muted">
              {t('location.deniedBody')}
            </Txt>
            <View className="mt-4 w-full gap-2">
              <Button full size="sm" icon={Settings} label={t('location.openSettings')} onPress={() => Linking.openSettings()} />
              <Button full size="sm" variant="secondary" icon={Search} label={t('location.searchManually')} onPress={() => setShowSearch(true)} />
            </View>
            <Txt variant="caption" className="mt-3 text-center text-muted">
              {t('location.onlyWhileReporting')}
            </Txt>
          </Card>
        ) : null}

        {(!denied || showSearch || location) && (
          <PlaceSearch
            near={location ?? lastFix}
            autoFocus={showSearch}
            onSelect={(p) => {
              map.current?.flyTo(p, 18);
              setMoved(true);
              placeAt({ lat: p.lat, lng: p.lng }, { address: p.address, area: p.area });
            }}
          />
        )}

        {!denied && (
          <Button full variant="secondary" icon={LocateFixed} label={status === 'locating' ? t('location.locating') : t('location.useMine')} loading={status === 'locating'} onPress={useMine} />
        )}
        {status === 'unavailable' && (
          <Txt variant="bodySm" className="text-danger-dark">
            {t('location.unavailable')}
          </Txt>
        )}

        {location && (
          <Card className="flex-row items-start gap-3" accessibilityLiveRegion="polite">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-danger-light">
              <MapPin size={20} color={colors.danger} />
            </View>
            <View className="flex-1">
              <Txt variant="caption" weight="medium" className="text-muted">
                {t('location.selected')}
              </Txt>
              {resolving && !location.address ? (
                <View className="mt-1 flex-row items-center gap-2">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Txt variant="bodySm" className="text-muted">
                    {t('location.findingAddress')}
                  </Txt>
                </View>
              ) : (
                <Txt weight="semibold">{address}</Txt>
              )}
              <Txt variant="caption" lang="en" className="mt-0.5 text-muted">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                {location.area ? ` · ${location.area}` : ''}
              </Txt>
              {geoError && (
                <Txt variant="caption" className="mt-1 text-warning-dark">
                  {t('location.addressUnavailable')}
                </Txt>
              )}
            </View>
          </Card>
        )}
      </View>
    </Screen>
  );
}
