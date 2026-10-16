import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Search, X } from 'lucide-react-native';
import { IconButton, Txt, useTextScale } from '@/components/ui';
import { colors, shadows } from '@/constants/theme';
import { useDebounce } from '@/hooks/useDebounce';
import { searchPlaces, type SearchResult } from '@/services/geocoding';
import type { LatLng } from '@/types';

interface PlaceSearchProps {
  onSelect: (place: SearchResult) => void;
  near?: LatLng | null;
  placeholder?: string;
  autoFocus?: boolean;
  floating?: boolean;
}

/** Nominatim street/landmark search (Sri Lanka only, debounced 700 ms). */
export function PlaceSearch({ onSelect, near, placeholder, autoFocus, floating }: PlaceSearchProps) {
  const { t } = useTranslation();
  const scale = useTextScale();
  const [q, setQ] = useState('');
  const debounced = useDebounce(q, 700);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (debounced.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    searchPlaces(debounced, near ?? undefined)
      .then((r) => !cancelled && setResults(r))
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // `near` intentionally not a dependency: re-searching on every map move would hit the rate limit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const showList = open && q.trim().length >= 3;

  return (
    <View>
      <View style={floating ? shadows.card : undefined} className="min-h-[52px] flex-row items-center gap-3 rounded-btn border border-line bg-white pl-4">
        <Search size={20} color={colors.muted} />
        <TextInput
          value={q}
          onChangeText={(v) => {
            setQ(v);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoFocus={autoFocus}
          placeholder={placeholder ?? t('map.searchPlaceholder')}
          placeholderTextColor={colors.placeholder}
          accessibilityLabel={placeholder ?? t('map.searchPlaceholder')}
          returnKeyType="search"
          style={{ flex: 1, fontSize: 16 * scale, color: colors.ink, paddingVertical: 12 }}
        />
        {loading ? (
          <View className="h-12 w-12 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : q ? (
          <IconButton icon={X} size={20} color={colors.muted} accessibilityLabel={t('common.clear')} onPress={() => setQ('')} />
        ) : (
          <View className="w-3" />
        )}
      </View>
      {showList && (
        <View style={shadows.card} className="mt-1 overflow-hidden rounded-btn border border-line bg-white">
          {error ? (
            <Txt variant="bodySm" className="px-4 py-3 text-danger-dark">
              {t('map.searchError')}
            </Txt>
          ) : !loading && results.length === 0 && debounced === q ? (
            <Txt variant="bodySm" className="px-4 py-3 text-muted">
              {t('map.noResults')}
            </Txt>
          ) : (
            results.map((r) => (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                onPress={() => {
                  setOpen(false);
                  setQ(r.address);
                  onSelect(r);
                }}
                className="min-h-12 flex-row items-center gap-3 border-b border-line px-4 py-2.5 active:bg-canvas"
              >
                <MapPin size={18} color={colors.muted} />
                <View className="flex-1">
                  <Txt variant="bodySm" weight="semibold" numberOfLines={1}>
                    {r.address}
                  </Txt>
                  <Txt variant="caption" numberOfLines={1} className="text-muted">
                    {r.detail}
                  </Txt>
                </View>
              </Pressable>
            ))
          )}
          <Txt variant="tiny" className="px-4 py-1.5 text-right text-placeholder">
            {t('map.nominatimCredit')}
          </Txt>
        </View>
      )}
    </View>
  );
}
