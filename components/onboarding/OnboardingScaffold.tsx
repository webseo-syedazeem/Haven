import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

const brandIcon = require('@/assets/images/passage-brand-assets/screens-icon.webp');

type Props = {
  backgroundImage?: ImageSourcePropType;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  header?: ReactNode;
  headerRight?: ReactNode;
  onBack?: () => void;
  scroll?: boolean;
};

export function OnboardingScaffold({
  backgroundImage,
  children,
  contentContainerStyle,
  footer,
  header,
  headerRight,
  onBack,
  scroll = true,
}: Props) {
  const defaultHeader = (
    <View style={styles.header}>
      {/* Absolute centered Brand - locked to horizontal center */}
      <View pointerEvents="none" style={styles.brandCenterAbsolute}>
        <Image source={brandIcon} style={styles.brandIcon} />
        <Text style={styles.brandText}>Passage</Text>
      </View>

      <View style={styles.headerSideSlot}>
        {onBack ? (
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons color={HalcyonColors.textPrimary} name="chevron-back" size={22} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.headerSideSlot}>
        {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
      </View>
    </View>
  );
  const headerNode = header !== undefined ? header : defaultHeader;
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
    width: 36,
  },
  background: { flex: 1 },
  brandCenterAbsolute: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  },
  headerSideSlot: {
    alignItems: 'flex-start',
    height: 40,
    justifyContent: 'center',
    width: 40,
    zIndex: 1,
  },
  brandIcon: {
    height: 22,
    resizeMode: 'contain',
    width: 38,
  },
  brandText: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginLeft: 9,
  },
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
    position: 'relative',
    width: '100%',
  },
  headerRight: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginLeft: 16,
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
