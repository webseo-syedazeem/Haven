import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HalcyonColors } from '@/constants/design';

type Props = {
  backgroundImage?: ImageSourcePropType;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  onBack?: () => void;
  scroll?: boolean;
};

export function OnboardingScaffold({
  backgroundImage,
  children,
  contentContainerStyle,
  footer,
  onBack,
  scroll = true,
}: Props) {
  const header = (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons color={HalcyonColors.textPrimary} name="chevron-back" size={19} />
        </Pressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fixedContent, contentContainerStyle]}>{children}</View>
  );
  const safeContent = (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      {header}
      {content}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {backgroundImage ? (
        <ImageBackground resizeMode="cover" source={backgroundImage} style={styles.background}>
          <View pointerEvents="none" style={styles.overlay} />
          {safeContent}
        </ImageBackground>
      ) : (
        safeContent
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderColor: HalcyonColors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginTop: 6,
    width: 36,
  },
  background: { flex: 1 },
  fixedContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  footer: {
    backgroundColor: HalcyonColors.background,
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  headerSpacer: { height: 36, width: 36 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,11,13,0.62)',
  },
  pressed: { opacity: 0.72 },
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
