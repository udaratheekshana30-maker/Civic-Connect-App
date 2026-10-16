import { useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Camera, Check, ChevronRight, LocateFixed, MapPinOff, RefreshCw, ThumbsUp, Users, X } from 'lucide-react-native';
import { OSMMap, type OSMMapHandle } from '@/components/map/OSMMap';
import { PlaceSearch } from '@/components/map/PlaceSearch';
import { Button, Chip, ErrorState, IconButton, Skeleton, StatusBadge, Txt } from '@/components/ui';
import { categoryGroups, groupIcon } from '@/constants/categoryGroups';
import { colors, shadows } from '@/constants/theme';
import { useCatalog } from '@/features/catalog/store';
import { useNearby } from '@/features/reports/hooks';
import { useSupport } from '@/features/reports/useSupport';
import { DEFAULT_CENTER, useLocation } from '@/hooks/useLocation';
import { errorMessage } from '@/services/errors';
import type { NearbyReport } from '@/services/reports';
import { thumb } from '@/services/cloudinary';
import type { CategoryGroupId, LatLng } from '@/types';
import { categoryName, formatDistance } from '@/utils/format';

const RADIUS = 5000;

// Reanimated views take plain styles (NativeWind className isn't applied to them).
const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden', borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.white },
});

export default function MapTab() {
  const { t } = useTranslation();
  const map = useRef<OSMMapHandle>(null);
  const { location, locate, status: locStatus } = useLocation();
  const [queryCenter, setQueryCenter] = useState<LatLng>(location ?? DEFAULT_CENTER);
  const [mapCenter, setMapCenter] = useState<LatLng>(queryCenter);
  const nearby = useNearby(queryCenter, RADIUS);
  const [filter, setFilter] = useState<CategoryGroupId | 'all'>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const category = useCatalog((s) => s.category);

  const list = useMemo(() => nearby.items.filter((r) => filter === 'all' || r.group === filter), [nearby.items, filter]);
  const active = list.find((r) => r.id === activeId) ?? null;
  const markers = useMemo(() => list.map((r) => ({ id: r.id, lat: r.location.lat, lng: r.location.lng, status: r.status, label: categoryName(category(r.categoryId)) })), [list, category]);

  // "Search this area" appears once the map has moved > ~1 km from the last query.
  const moved = Math.abs(mapCenter.lat - queryCenter.lat) + Math.abs(mapCenter.lng - queryCenter.lng) > 0.01;

  const locateMe = async () => {
    const ll = await locate();
    if (ll) {
      map.current?.flyTo(ll, 16);
      setQueryCenter(ll);
    }
  };

  // Only plain values may be captured by a Reanimated worklet: capturing the
  // report object (it contains Firestore Timestamps) crashed the app on tap.
  const hasActive = active !== null;
  const sheet = useAnimatedStyle(() => ({ height: withTiming(hasActive ? 0 : expanded ? 380 : 200, { duration: 250 }) }));

  return (
    <View className="flex-1 bg-canvas">
      <OSMMap
        ref={map}
        initialCenter={queryCenter}
        initialZoom={14}
        markers={markers}
        activeId={activeId}
        user={location}
        onMarkerPress={(id) => setActiveId(id)}
        onMapPress={() => setActiveId(null)}
        onMoveEnd={(e) => setMapCenter({ lat: e.lat, lng: e.lng })}
        onReady={() => {
          // Centre on the user if they've already allowed location.
          if (!location) locate().then((ll) => ll && (map.current?.flyTo(ll, 15), setQueryCenter(ll)));
        }}
        className="absolute inset-0"
        accessibilityLabel={t('map.a11y', { count: list.length })}
      />

      {/* top: search + filters */}
      <SafeAreaView edges={['top']} className="absolute inset-x-0 top-0" pointerEvents="box-none">
        <View className="px-4 pt-2" pointerEvents="box-none">
          <PlaceSearch
            floating
            near={mapCenter}
            onSelect={(p) => {
              map.current?.flyTo(p, 16);
              setQueryCenter(p);
            }}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerClassName="gap-2 px-4 py-2">
          <Chip tone="floating" label={t('map.all')} selected={filter === 'all'} onPress={() => setFilter('all')} />
          {categoryGroups.map((g) => (
            <Chip key={g.id} tone="floating" label={t(`categoryGroup.${g.id}.short`)} selected={filter === g.id} onPress={() => setFilter(g.id)} />
          ))}
        </ScrollView>
        {locStatus === 'denied' && (
          <View className="mx-4 flex-row items-center gap-2 rounded-btn bg-warning-light px-3 py-2">
            <MapPinOff size={18} color="#92400E" />
            <Txt variant="caption" className="flex-1 text-warning-dark">
              {t('map.locationDenied')}
            </Txt>
          </View>
        )}
        {moved && !nearby.loading && (
          <View className="items-center pt-1" pointerEvents="box-none">
            <Pressable accessibilityRole="button" onPress={() => setQueryCenter(mapCenter)} style={shadows.card} className="min-h-11 flex-row items-center gap-2 rounded-full bg-white px-4">
              <RefreshCw size={16} color={colors.primary} />
              <Txt variant="bodySm" weight="semibold" className="text-primary">
                {t('map.searchArea')}
              </Txt>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      {/* locate me */}
      <View className="absolute right-4" style={{ bottom: active ? 300 : expanded ? 396 : 216 }}>
        <IconButton icon={LocateFixed} color={colors.primary} accessibilityLabel={t('map.locateMe')} onPress={locateMe} className="bg-white" style={shadows.card} />
      </View>

      {/* bottom sheet list */}
      <Animated.View style={[styles.sheet, shadows.sheet, sheet]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? t('map.collapse') : t('map.expand')}
          onPress={() => setExpanded(!expanded)}
          className="h-8 items-center justify-center"
        >
          <View className="h-1.5 w-10 rounded-full bg-line" />
        </Pressable>
        <View className="flex-row items-baseline justify-between px-4 pb-2">
          <Txt variant="h2">{t('map.count', { count: list.length })}</Txt>
          <Txt variant="caption" className="text-muted">
            {t('map.within', { km: RADIUS / 1000 })}
          </Txt>
        </View>
        <ScrollView contentContainerClassName="px-2 pb-4">
          {nearby.loading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="mx-2 mb-2 h-16" />)
          ) : nearby.error ? (
            <ErrorState body={errorMessage(nearby.error)} onRetry={nearby.reload} />
          ) : list.length === 0 ? (
            <View className="items-center py-6">
              <MapPinOff size={32} color={colors.placeholder} />
              <Txt className="mt-2 text-center text-muted">{t('map.empty')}</Txt>
            </View>
          ) : (
            list.map((r) => <ListRow key={r.id} r={r} onPress={() => (setActiveId(r.id), map.current?.flyTo(r.location, 17))} />)
          )}
        </ScrollView>
      </Animated.View>

      {active && <IssuePreview key={active.id} r={active} onClose={() => setActiveId(null)} onChange={(on, count) => nearby.setItems((items) => items.map((x) => (x.id === active.id ? { ...x, supportCount: count } : x)))} />}
    </View>
  );
}

function ListRow({ r, onPress }: { r: NearbyReport; onPress: () => void }) {
  const category = useCatalog((s) => s.category(r.categoryId));
  const Icon = groupIcon(r.group);
  const photo = r.media.find((m) => m.type === 'image');
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="flex-row items-center gap-3 rounded-btn px-2 py-2.5 active:bg-canvas">
      {photo ? (
        <Image source={{ uri: thumb(photo.url, 120) }} className="h-14 w-14 rounded-btn bg-line" accessibilityIgnoresInvertColors />
      ) : (
        <View className="h-14 w-14 items-center justify-center rounded-btn bg-primary-light">
          <Icon size={24} color={colors.primary} />
        </View>
      )}
      <View className="flex-1">
        <Txt weight="semibold" numberOfLines={1}>
          {categoryName(category)}
        </Txt>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Txt variant="caption" className="text-muted">
            {formatDistance(r.distance)}
          </Txt>
          <Users size={14} color={colors.muted} />
          <Txt variant="caption" className="text-muted">
            {String(r.supportCount)}
          </Txt>
        </View>
      </View>
      <StatusBadge status={r.status} size="sm" />
    </Pressable>
  );
}

/** Bottom card when a pin is tapped: photo, distance, support toggle, add info. */
function IssuePreview({ r, onClose, onChange }: { r: NearbyReport; onClose: () => void; onChange: (on: boolean, count: number) => void }) {
  const { t } = useTranslation();
  const category = useCatalog((s) => s.category(r.categoryId));
  const { supported, count, toggle, busy, isOwn } = useSupport(r, onChange);
  const photo = r.media.find((m) => m.type === 'image');
  return (
    <View style={shadows.sheet} className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-white px-4 pb-4 pt-3">
      <View className="flex-row items-start gap-3">
        <Pressable accessibilityRole="button" onPress={() => router.push(`/issue/${r.id}`)} className="flex-1 flex-row gap-3">
          {photo ? (
            <Image source={{ uri: thumb(photo.url, 200) }} className="h-20 w-20 rounded-btn bg-line" accessibilityIgnoresInvertColors />
          ) : null}
          <View className="flex-1">
            <Txt variant="h2" numberOfLines={1}>
              {categoryName(category)}
            </Txt>
            <Txt variant="caption" numberOfLines={1} className="text-muted">
              {formatDistance(r.distance)} · {r.location.address}
            </Txt>
            <View className="mt-1.5 flex-row items-center gap-2">
              <StatusBadge status={r.status} size="sm" />
              <Txt variant="caption" className="text-muted">
                {t('issue.supportCount', { count })}
              </Txt>
            </View>
          </View>
        </Pressable>
        <IconButton icon={X} accessibilityLabel={t('common.close')} onPress={onClose} className="-mr-2 -mt-2" />
      </View>
      <View className="mt-3 flex-row gap-2">
        {!isOwn && (
          <Button
            size="sm"
            className="flex-1 px-2"
            variant={supported ? 'secondary' : 'primary'}
            icon={supported ? Check : ThumbsUp}
            label={supported ? t('issue.supported') : t('issue.support')}
            accessibilityState={{ selected: supported }}
            disabled={busy}
            onPress={toggle}
          />
        )}
        <Button size="sm" className="flex-1 px-2" variant="secondary" icon={Camera} label={t('issue.addInfo')} onPress={() => router.push(`/add-info/${r.id}`)} />
      </View>
      <Pressable accessibilityRole="link" onPress={() => router.push(`/issue/${r.id}`)} className="mt-1 h-11 flex-row items-center justify-center gap-1">
        <Txt variant="bodySm" weight="semibold" className="text-primary">
          {t('issue.viewDetails')}
        </Txt>
        <ChevronRight size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}
