import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  PassageColors,
  PassageModal,
  ONBOARDING_MODE_ACCENTS,
  ONBOARDING_MODE_ACCENTS_PRESSED,
} from '@/constants/design';
import type { ModeId } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';

type ConfirmationContent = {
  accent: string;
  accentPressed: string;
  body: string;
  buttonLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
};

const CONFIRMATION_BY_MODE: Record<ModeId, ConfirmationContent> = {
  focus: {
    accent: ONBOARDING_MODE_ACCENTS.focus,
    accentPressed: ONBOARDING_MODE_ACCENTS_PRESSED.focus,
    body:
      "The app will be customised for Focus, but you can still explore other areas on the home page.",
    buttonLabel: 'Continue with Focus',
    icon: 'stats-chart',
    title: 'Continue with Focus?',
  },
  sleep: {
    accent: ONBOARDING_MODE_ACCENTS.sleep,
    accentPressed: ONBOARDING_MODE_ACCENTS_PRESSED.sleep,
    body:
      "The app will be customised for Sleep, but you can still explore other areas on the home page.",
    buttonLabel: 'Continue with Sleep',
    icon: 'moon',
    title: 'Continue with Sleep?',
  },
  relax: {
    accent: ONBOARDING_MODE_ACCENTS.relax,
    accentPressed: ONBOARDING_MODE_ACCENTS_PRESSED.relax,
    body:
      "The app will be customised for Relax, but you can still explore other areas on the home page.",
    buttonLabel: 'Continue with Relax',
    icon: 'leaf-outline',
    title: 'Continue with Relax?',
  },
};

type Props = {
  disabled?: boolean;
  mode: ModeId | null;
  onChooseAnother: () => void;
  onConfirm: () => void;
  visible: boolean;
};

export function AreaConfirmationModal({
  disabled = false,
  mode,
  onChooseAnother,
  onConfirm,
  visible,
}: Props) {
  if (!mode) return null;
  const content = CONFIRMATION_BY_MODE[mode];

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={onChooseAnother}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Choose another area"
          onPress={onChooseAnother}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.glowFrame,
            { borderColor: content.accent + '8A', shadowColor: content.accent },
          ]}>
          <View style={styles.card}>
            <BlurView
              experimentalBlurMethod="dimezisBlurView"
              intensity={38}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              tint="dark"
            />
            <LinearGradient
              colors={[
                content.accent + '20',
                'rgba(22, 22, 26, 0.88)',
                'rgba(11, 11, 13, 0.97)',
              ]}
              locations={[0, 0.48, 1]}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.handle} />
            <View
              style={[
                styles.iconHalo,
                {
                  backgroundColor: content.accent + '14',
                  borderColor: content.accent + '42',
                  shadowColor: content.accent,
                },
              ]}>
              <Ionicons color={content.accent} name={content.icon} size={29} />
            </View>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.body}>{content.body}</Text>
            <Pressable
              accessibilityLabel={content.buttonLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled }}
              disabled={disabled}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: pressed ? content.accentPressed : content.accent },
                disabled && styles.disabled,
              ]}>
              <Text style={styles.primaryLabel}>{content.buttonLabel}</Text>
              <Ionicons
                color={PassageColors.background}
                name="arrow-forward"
                size={19}
                style={styles.primaryArrow}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={disabled}
              hitSlop={8}
              onPress={onChooseAnother}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryPressed,
              ]}>
              <Text style={styles.secondaryLabel}>Choose another area</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    color: 'rgba(241, 236, 227, 0.72)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 26,
    marginTop: 11,
    maxWidth: 320,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(13, 13, 16, 0.76)',
    borderRadius: 26,
    overflow: 'hidden',
    paddingBottom: 17,
    paddingHorizontal: 22,
    paddingTop: 12,
    width: '100%',
  },
  disabled: {
    opacity: 0.58,
  },
  glowFrame: {
    borderRadius: 27,
    borderWidth: 1,
    elevation: 14,
    maxWidth: 392,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    width: '100%',
  },
  handle: {
    backgroundColor: 'rgba(241, 236, 227, 0.32)',
    borderRadius: 3,
    height: 4,
    marginBottom: 17,
    width: 42,
  },
  iconHalo: {
    alignItems: 'center',
    borderRadius: 29,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    marginBottom: 15,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    width: 58,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: PassageModal.backdrop,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  primaryArrow: {
    position: 'absolute',
    right: 20,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 48,
    width: '100%',
  },
  primaryLabel: {
    color: PassageColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.15,
    lineHeight: 21,
    textAlign: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingTop: 5,
  },
  secondaryLabel: {
    color: 'rgba(241, 236, 227, 0.76)',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
  secondaryPressed: {
    opacity: 0.64,
  },
  title: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 28,
    letterSpacing: -0.35,
    lineHeight: 35,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
});
