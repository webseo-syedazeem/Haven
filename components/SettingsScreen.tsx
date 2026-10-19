import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, type ReactNode } from 'react';
import {
  Animated,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HalcyonColors, HalcyonSpacing, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

const ANDROID_NAV_FALLBACK = 34;

type SettingsScreenProps = {
  title: string;
  /** Muted line under the heading. */
  subtitle?: string;
  children: ReactNode;
  /** Rendered over the scroll view — toasts, sheets, modals. */
  overlay?: ReactNode;
  /** Extra bottom padding on top of the safe area. */
  bottomExtra?: number;
  /** Scenic backdrop for this screen only — falls back to the flat ground when omitted. */
  backgroundImage?: ImageSourcePropType;
  /** Optional screen-specific tint layered over the scenic backdrop. */
  backgroundOverlayColor?: string;
  /**
   * Scroll the backdrop with the body and fade in a black status-bar cover as
   * it moves, matching the main Profile screen. Needs `backgroundImage`.
   */
  scrollingBackground?: boolean;
};

/**
 * The shared frame for every profile settings screen: the black opal ground, a
 * back chevron, a serif heading, and a scroll body that clears the home
 * indicator. These screens are pushed on the root stack, above the tab bar and
 * mini player, but the bottom inset is still reserved so the last row is never
 * flush against the edge of the display.
 */
export function SettingsScreen({
  title,
  subtitle,
  children,
  overlay,
  bottomExtra = 32,
  backgroundImage,
  backgroundOverlayColor,
  scrollingBackground = false,
}: SettingsScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset =
    Math.max(insets.bottom, Platform.OS === 'android' ? ANDROID_NAV_FALLBACK : 0) + bottomExtra;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = scrollAnim.interpolate({
    inputRange: [0, 30],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const header = (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={12}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Ionicons color="#FFFFFF" name="chevron-back" size={28} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );

  const body = (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {header}
        {children}
      </ScrollView>
    </SafeAreaView>
  );

  // Same structure as the main Profile screen: the artwork lives inside the
  // scroll view so it moves with the content, and the status-bar cover is an
  // absolute layer that only appears once the content has scrolled.
  if (scrollingBackground && backgroundImage) {
    return (
      <View style={styles.screen}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollAnim } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}>
          <ImageBackground
            resizeMode="cover"
            source={backgroundImage}
            style={[
              styles.scrollScene,
              { paddingBottom: bottomInset, paddingTop: insets.top + 6 },
            ]}>
            <LinearGradient
              colors={['rgba(0,0,0,0.52)', 'rgba(0,0,0,0.20)', 'rgba(0,0,0,0)']}
              locations={[0, 0.3, 0.55]}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
            {!!backgroundOverlayColor && (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { backgroundColor: backgroundOverlayColor }]}
              />
            )}
            {header}
            {children}
          </ImageBackground>
        </Animated.ScrollView>

        <Animated.View
          pointerEvents="none"
          style={[styles.topCover, { height: insets.top, opacity: overlayOpacity }]}
        />
        {overlay}
      </View>
    );
  }

  if (backgroundImage) {
    return (
      <ImageBackground resizeMode="cover" source={backgroundImage} style={styles.screen}>
        <LinearGradient
          colors={['rgba(0,0,0,0.52)', 'rgba(0,0,0,0.20)', 'rgba(0,0,0,0)']}
          locations={[0, 0.3, 0.55]}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        {!!backgroundOverlayColor && (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: backgroundOverlayColor }]}
          />
        )}
        {body}
        {overlay}
      </ImageBackground>
    );
  }

  return (
    <View style={styles.screen}>
      {body}
      {overlay}
    </View>
  );
}

/** The gold pill used for the one primary action on a settings screen. */
export function SettingsPrimaryButton({
  label,
  onPress,
  disabled = false,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Replaces the label, for a spinner while submitting. */
  children?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.primaryButtonPressed,
        disabled && styles.primaryButtonDisabled,
      ]}>
      {children ?? <Text style={styles.primaryLabel}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollScene: {
    flexGrow: 1,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  topCover: {
    backgroundColor: '#000000',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 6,
  },
  header: {
    marginBottom: 22,
  },
  backButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    marginBottom: 10,
    width: 48,
  },
  pressed: {
    opacity: 0.6,
  },
  title: {
    ...Typography.screenHeading,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.94)',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButtonPressed: {
    backgroundColor: HalcyonColors.accentPressed,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
