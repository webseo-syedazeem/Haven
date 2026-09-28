import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
}: SettingsScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset =
    Math.max(insets.bottom, Platform.OS === 'android' ? ANDROID_NAV_FALLBACK : 0) + bottomExtra;

  const header = (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={12}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Ionicons color={HalcyonColors.textPrimary} name="chevron-back" size={20} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {header}
          {children}
        </ScrollView>
      </SafeAreaView>
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
  content: {
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 6,
  },
  header: {
    marginBottom: 22,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 11, 13, 0.42)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginBottom: 10,
    width: 36,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.78,
  },
  title: {
    ...Typography.screenHeading,
    color: HalcyonColors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: HalcyonColors.textSecondary,
    marginTop: 6,
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
