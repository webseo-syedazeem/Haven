import { Modal, StyleSheet, Text, View } from 'react-native';

import { ExploreButton } from '@/components/ExploreButton';
import { ExploreCheckBadge } from '@/components/explore-gradient';
import { AppFonts } from '@/constants/theme';

type SaveSuccessModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function SaveSuccessModal({
  visible,
  title,
  message,
  onClose,
}: SaveSuccessModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ExploreCheckBadge size={68} />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <ExploreButton label="OK" onPress={onClose} style={styles.button} />
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
    gap: 0,
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
  button: {
    width: '100%',
  },
});
