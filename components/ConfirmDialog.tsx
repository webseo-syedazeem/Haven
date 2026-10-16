import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { DESTRUCTIVE_COLOR } from '@/components/SettingsRow';
import { HalcyonColors, HalcyonModal, HalcyonRadius, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Muted red confirm button, for delete and remove-all. */
  destructive?: boolean;
  loading?: boolean;
  /** Login-prompt style: close with the X instead of a second cancel action. */
  showCancel?: boolean;
  /** Hide the decorative icon for quieter confirmations such as sign out. */
  showIcon?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * The black opal confirm dialog. Anything that cannot be undone — deleting an
 * account, deleting a playlist, signing out — goes through this rather than a
 * platform `Alert`, so the moment of decision looks like the rest of the app.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  icon = 'alert-circle-outline',
  destructive = false,
  loading = false,
  showCancel = true,
  showIcon = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const accent = destructive ? DESTRUCTIVE_COLOR : HalcyonColors.accent;

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close confirmation"
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />

        <View accessibilityViewIsModal style={styles.card}>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            disabled={loading}
            hitSlop={10}
            onPress={onCancel}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Ionicons color={HalcyonColors.textSecondary} name="close" size={19} />
          </Pressable>

          {showIcon ? (
            <View style={[styles.iconRing, { borderColor: accent }]}>
              <Ionicons color={accent} name={icon} size={26} />
            </View>
          ) : null}

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable
            accessibilityLabel={confirmLabel}
            accessibilityRole="button"
            disabled={loading}
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.confirm,
              { backgroundColor: accent },
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}>
            {loading ? (
              <ActivityIndicator color={HalcyonColors.background} />
            ) : (
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
            )}
          </Pressable>

          {showCancel ? (
            <Pressable
              accessibilityLabel={cancelLabel}
              accessibilityRole="button"
              disabled={loading}
              onPress={onCancel}
              style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: HalcyonModal.backdrop,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  card: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    maxWidth: 360,
    padding: 24,
    width: '100%',
  },
  closeButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    width: 32,
  },
  iconRing: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    marginBottom: 16,
    width: 56,
  },
  title: {
    ...Typography.sectionHeading,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: HalcyonColors.textSecondary,
    marginBottom: 26,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
  confirm: {
    alignItems: 'center',
    borderRadius: HalcyonRadius.pill,
    justifyContent: 'center',
    minHeight: 48,
    width: '100%',
  },
  confirmLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  cancel: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 44,
    width: '100%',
  },
  cancelLabel: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.7,
  },
});
