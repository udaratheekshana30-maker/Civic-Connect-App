import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ClipboardList, House, Map, Plus, User, type LucideIcon } from 'lucide-react-native';
import { Txt } from '@/components/ui';
import { colors, shadows } from '@/constants/theme';

const tabs: { route: string; labelKey: string; icon: LucideIcon }[] = [
  { route: 'index', labelKey: 'tabs.home', icon: House },
  { route: 'map', labelKey: 'tabs.map', icon: Map },
  { route: 'my-reports', labelKey: 'tabs.myReports', icon: ClipboardList },
  { route: 'profile', labelKey: 'tabs.profile', icon: User },
];

/** Bottom nav from the design: 4 tabs + raised centre "Report" button. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;

  const renderTab = (tab: (typeof tabs)[number]) => {
    const active = current === tab.route;
    const Icon = tab.icon;
    return (
      <Pressable
        key={tab.route}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => {
          const route = state.routes.find((r) => r.name === tab.route);
          const event = navigation.emit({ type: 'tabPress', target: route?.key ?? '', canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigation.navigate(tab.route);
        }}
        className="flex-1 items-center justify-center gap-0.5"
      >
        <Icon size={24} color={active ? colors.primary : colors.muted} strokeWidth={active ? 2.4 : 2} />
        <Txt variant="caption" weight={active ? 'semibold' : 'medium'} numberOfLines={1} className={active ? 'text-primary' : 'text-muted'}>
          {t(tab.labelKey)}
        </Txt>
      </Pressable>
    );
  };

  return (
    <View className="border-t border-line bg-white" style={{ paddingBottom: insets.bottom }}>
      <View className="h-16 flex-row">
        {tabs.slice(0, 2).map(renderTab)}
        <View className="flex-1 items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('tabs.reportA11y')}
            onPress={() => router.push('/report/category')}
            className="absolute -top-6 h-[60px] w-[60px] items-center justify-center rounded-full border-4 border-white bg-primary active:bg-primary-dark"
            style={shadows.raised}
          >
            <Plus size={28} color={colors.white} strokeWidth={2.5} />
          </Pressable>
          <Txt variant="caption" weight="semibold" className="absolute bottom-2 text-primary" importantForAccessibility="no">
            {t('tabs.report')}
          </Txt>
        </View>
        {tabs.slice(2).map(renderTab)}
      </View>
    </View>
  );
}
