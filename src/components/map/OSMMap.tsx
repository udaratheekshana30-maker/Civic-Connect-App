import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Linking, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { statuses } from '@/constants/statuses';
import { colors } from '@/constants/theme';
import type { LatLng, StatusKey } from '@/types';
import { leafletHtml } from './leafletHtml';

export interface MapMarker extends LatLng {
  id: string;
  status: StatusKey;
  label: string;
}

export interface OSMMapHandle {
  flyTo: (p: LatLng, zoom?: number) => void;
  fitTo: (points: LatLng[], maxZoom?: number) => void;
}

interface OSMMapProps {
  initialCenter: LatLng;
  initialZoom?: number;
  markers?: MapMarker[];
  activeId?: string | null;
  user?: LatLng | null;
  /** centre-fixed pin for choosing a location; listen to onMoveEnd */
  pickMode?: boolean;
  /** false for small previews (no panning/zooming) */
  interactive?: boolean;
  onMarkerPress?: (id: string) => void;
  onMoveEnd?: (e: LatLng & { zoom: number; byUser: boolean }) => void;
  onMapPress?: () => void;
  onReady?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
}

const BASE_URL = 'https://civicconnect.app/';
// OSM tile policy asks apps to identify themselves.
const USER_AGENT = 'CivicConnect/1.0 (Android; react-native-webview; civic issue reporting, Sri Lanka)';

type MapMessage =
  | { type: 'ready' }
  | { type: 'markerPress'; id: string }
  | { type: 'moveEnd'; lat: number; lng: number; zoom: number; user: boolean }
  | { type: 'mapPress' }
  | { type: 'error'; message: string };

/**
 * Reusable OpenStreetMap view (Leaflet in a WebView — works in Expo Go, free,
 * no API key). Status-coloured markers, centre-pin picking mode, user dot.
 */
export const OSMMap = forwardRef<OSMMapHandle, OSMMapProps>(function OSMMap(
  {
    initialCenter,
    initialZoom = 15,
    markers,
    activeId,
    user,
    pickMode = false,
    interactive = true,
    onMarkerPress,
    onMoveEnd,
    onMapPress,
    onReady,
    style,
    className = '',
    accessibilityLabel,
  },
  ref,
) {
  const web = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const initial = useRef({ center: initialCenter, zoom: initialZoom });

  const run = useCallback((js: string) => web.current?.injectJavaScript(`try{${js}}catch(e){};true;`), []);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (p, zoom) => run(`cc.setView(${p.lat},${p.lng},${zoom ?? 'null'},true)`),
      fitTo: (points, maxZoom) => run(`cc.fitTo(${JSON.stringify(points.map(({ lat, lng }) => ({ lat, lng })))},${maxZoom ?? 'null'})`),
    }),
    [run],
  );

  // Push props into the map whenever they change (after the page is ready).
  useEffect(() => {
    if (!ready) return;
    const list = (markers ?? []).map((m) => ({ id: m.id, lat: m.lat, lng: m.lng, label: m.label, color: statuses[m.status].color }));
    run(`cc.setMarkers(${JSON.stringify(list)}); cc.setActive(${JSON.stringify(activeId ?? null)})`);
  }, [ready, markers, activeId, run]);

  useEffect(() => {
    if (ready) run(user ? `cc.setUser(${user.lat},${user.lng})` : 'cc.setUser(null)');
  }, [ready, user, run]);

  useEffect(() => {
    if (ready) run(`cc.setPickMode(${pickMode})`);
  }, [ready, pickMode, run]);

  useEffect(() => {
    if (ready) run(`cc.setInteractive(${interactive})`);
  }, [ready, interactive, run]);

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: MapMessage;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    switch (msg.type) {
      case 'ready': {
        const { center, zoom } = initial.current;
        run(`cc.setView(${center.lat},${center.lng},${zoom},false)`);
        setReady(true);
        onReady?.();
        break;
      }
      case 'markerPress':
        onMarkerPress?.(msg.id);
        break;
      case 'moveEnd':
        onMoveEnd?.({ lat: msg.lat, lng: msg.lng, zoom: msg.zoom, byUser: msg.user });
        break;
      case 'mapPress':
        onMapPress?.();
        break;
    }
  };

  return (
    <View className={`overflow-hidden bg-[#EEF2EA] ${className}`} style={style} accessibilityLabel={accessibilityLabel}>
      <WebView
        ref={web}
        originWhitelist={['*']}
        source={{ html: leafletHtml, baseUrl: BASE_URL }}
        userAgent={USER_AGENT}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"
        style={{ flex: 1, backgroundColor: 'transparent' }}
        // Links (e.g. the OSM attribution) open in the browser, not the map.
        onShouldStartLoadWithRequest={(req) => {
          if (req.url.startsWith(BASE_URL) || req.url.startsWith('about:') || req.url.startsWith('data:')) return true;
          Linking.openURL(req.url).catch(() => {});
          return false;
        }}
      />
      {!ready && (
        <View className="absolute inset-0 items-center justify-center bg-[#EEF2EA]" pointerEvents="none">
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </View>
  );
});
