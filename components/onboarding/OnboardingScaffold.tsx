import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingBrandHeader } from '@/components/onboarding/OnboardingBrandHeader';
import { HalcyonColors } from '@/constants/design';

type Props = {
  backgroundImage?: ImageSourcePropType;
  backgroundOverlayColor?: string;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  header?: ReactNode;
  headerRight?: ReactNode;
  onBack?: () => void;
  onViewportLayout?: (event: LayoutChangeEvent) => void;
  scroll?: boolean;
};

export function OnboardingScaffold({
  backgroundImage,
  backgroundOverlayColor = 'rgba(11,11,13,0.62)',
  children,
  contentContainerStyle,
  footer,
  header,
  headerRight,
  onBack,
  onViewportLayout,
  scroll = true,
}: Props) {
  const defaultHeader = (
    <OnboardingBrandHeader onBack={onBack} right={headerRight} />
  );
  const headerNode = header !== undefined ? header : defaultHeader;
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      onLayout={onViewportLayout}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View
      onLayout={onViewportLayout}
      style={[styles.fixedContent, contentContainerStyle]}>
      {children}
    </View>
  );
  const safeContent = (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      {headerNode}
      {content}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {backgroundImage ? (
        <ImageBackground resizeMode="cover" source={backgroundImage} style={styles.background}>
          <View
            pointerEvents="none"
            style={[styles.overlay, { backgroundColor: backgroundOverlayColor }]}
          />
          {safeContent}
        </ImageBackground>
      ) : (
        safeContent
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  fixedContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  footer: {
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,11,13,0.62)',
  },
  safeArea: { flex: 1 },
  screen: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
});
