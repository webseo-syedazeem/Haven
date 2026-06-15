import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { ExploreButton } from '@/components/ExploreButton';
import { ExploreIconBadge } from '@/components/explore-gradient';
import { AppFonts } from '@/constants/theme';

const REMOVE_GRADIENT_COLORS = ['#FF0059', '#FF4D8D'] as const;
const REMOVE_GRADIENT_LOCATIONS = [0, 1] as const;

type ConfirmActionModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmActionModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  icon = 'alert-circle-outline',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ExploreIconBadge
            colors={REMOVE_GRADIENT_COLORS}
            icon={icon}
            locations={REMOVE_GRADIENT_LOCATIONS}
            size={68}
          />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <ExploreButton
            disabled={loading}
            gradientColors={REMOVE_GRADIENT_COLORS}
            gradientEnd={{ x: 1, y: 1 }}
            gradientLocations={REMOVE_GRADIENT_LOCATIONS}
            gradientStart={{ x: 0, y: 0 }}
            label={confirmLabel}
            loading={loading}
            shadowColor="rgb(255, 0, 89)"
            style={styles.confirmButton}
            onPress={onConfirm}
          />

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(23, 63, 95, 0.42)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    maxWidth: 360,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    width: '100%',
    elevation: 12,
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 8,
    marginTop: 18,
    textAlign: 'center',
  },
  message: {
    color: '#6F7E8B',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 22,
    textAlign: 'center',
  },
  confirmButton: {
    marginBottom: 10,
    width: '100%',
  },
  cancelButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: '100%',
  },
  cancelText: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
