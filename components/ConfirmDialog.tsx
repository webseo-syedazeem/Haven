import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { DESTRUCTIVE_COLOR } from '@/components/SettingsRow';
import { HalcyonColors, HalcyonRadius } from '@/constants/design';
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
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * The black opal confirm dialog. Anything that cannot be undone — deleting an
 * account, clearing every download, signing out — goes through this rather than
 * a platform `Alert`, so the moment of decision looks like the rest of the app.
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
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const accent = destructive ? DESTRUCTIVE_COLOR : HalcyonColors.accent;

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconRing, { borderColor: accent }]}>
            <Ionicons color={accent} name={icon} size={26} />
          </View>

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

          <Pressable
            accessibilityLabel={cancelLabel}
            accessibilityRole="button"
            disabled={loading}
            onPress={onCancel}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
            <Text style={styles.cancelLabel}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(4,4,6,0.72)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  card: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: 22,
    borderWidth: 1,
    maxWidth: 360,
    paddingHorizontal: 22,
    paddingVertical: 26,
    width: '100%',
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
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 29,
    textAlign: 'center',
  },
  message: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 22,
    marginTop: 8,
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
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  cancel: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 44,
    width: '100%',
  },
  cancelLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.7,
  },
});
