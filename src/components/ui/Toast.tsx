import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { create } from 'zustand';
import { Txt } from './Txt';

interface ToastOptions {
  tone?: 'success' | 'error';
  actionLabel?: string;
  onAction?: () => void;
  /** ms; default 3500 (longer when there's an action like Undo) */
  duration?: number;
}

interface ToastState extends ToastOptions {
  id: number;
  message: string | null;
  show: (message: string, opts?: ToastOptions) => void;
  hide: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  id: 0,
  message: null,
  show: (message, opts = {}) => set((s) => ({ id: s.id + 1, message, tone: 'success', actionLabel: undefined, onAction: undefined, duration: undefined, ...opts })),
  hide: () => set({ message: null }),
}));

/** Show a toast from anywhere: `toast('Saved')`, `toast('Removed', { actionLabel: 'Undo', onAction })`. */
export const toast = (message: string, opts?: ToastOptions) => useToastStore.getState().show(message, opts);

/** Mounted once in the root layout. `bottom` lifts it above tab bars/footers. */
export function ToastHost({ bottom = 24 }: { bottom?: number }) {
  const { id, message, tone, actionLabel, onAction, duration, hide } = useToastStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, duration ?? (actionLabel ? 5000 : 3500));
    return () => clearTimeout(t);
  }, [id, message, duration, actionLabel, hide]);

  if (!message) return null;
  const Icon = tone === 'error' ? CircleAlert : CircleCheck;
  return (
    <View pointerEvents="box-none" className="absolute inset-x-4" style={{ bottom: bottom + insets.bottom }}>
      <Animated.View
        key={id}
        entering={FadeInDown.duration(200)}
        exiting={FadeOutDown.duration(150)}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <View className="flex-row items-center gap-3 rounded-btn bg-ink px-4 py-2">
        <Icon size={20} color={tone === 'error' ? '#FCA5A5' : '#4ADE80'} />
        <Txt variant="bodySm" weight="medium" className="flex-1 py-2 text-white">
          {message}
        </Txt>
        {actionLabel && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onAction?.();
              hide();
            }}
            className="h-11 justify-center rounded-lg px-3 active:bg-white/10"
          >
            <Txt variant="bodySm" weight="semibold" className="text-green-300">
              {actionLabel}
            </Txt>
          </Pressable>
        )}
        </View>
      </Animated.View>
    </View>
  );
}
