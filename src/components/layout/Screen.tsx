import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppBar } from './AppBar';

interface ScreenProps {
  children: ReactNode;
  /** shows an AppBar with a back button */
  title?: string;
  onBack?: (() => void) | false;
  actions?: ReactNode;
  /** custom content above the scroll area (instead of / under the AppBar) */
  header?: ReactNode;
  /** sticky bottom area, e.g. a primary button */
  footer?: ReactNode;
  scroll?: boolean;
  /** inside tab navigator: the tab bar handles the bottom inset */
  inTabs?: boolean;
  className?: string;
  statusBar?: 'dark' | 'light';
  contentContainerClassName?: string;
  scrollProps?: ScrollViewProps;
}

export function Screen({
  children,
  title,
  onBack,
  actions,
  header,
  footer,
  scroll = true,
  inTabs,
  className = 'bg-canvas',
  statusBar = 'dark',
  contentContainerClassName = 'pb-8',
  scrollProps,
}: ScreenProps) {
  const edges = inTabs || footer ? (['top'] as const) : (['top', 'bottom'] as const);
  return (
    <SafeAreaView edges={edges} className={`flex-1 ${className}`}>
      <StatusBar style={statusBar} />
      {title !== undefined && <AppBar title={title} onBack={onBack} actions={actions} />}
      {header}
      <KeyboardAvoidingView behavior="height" className="flex-1">
        {scroll ? (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName={contentContainerClassName} {...scrollProps}>
            {children}
          </ScrollView>
        ) : (
          <View className="flex-1">{children}</View>
        )}
        {footer && (
          <SafeAreaView edges={['bottom']} className="border-t border-line bg-white px-4 pb-2 pt-3">
            {footer}
          </SafeAreaView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
