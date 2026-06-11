import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

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
          <LinearGradient
            colors={['#6339FB', '#3770FC', '#6AAFE9']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.iconWrap}>
            <MaterialIcons color="#FFFFFF" name="check" size={34} />
          </LinearGradient>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <LinearGradient
              colors={['#6339FB', '#3770FC', '#6AAFE9']}
              end={{ x: 1, y: 0.5 }}
              start={{ x: 0, y: 0.5 }}
              style={styles.buttonGradient}>
              <Text style={styles.buttonText}>OK</Text>
            </LinearGradient>
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
  iconWrap: {
    alignItems: 'center',
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    marginBottom: 18,
    width: 68,
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 8,
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
    borderRadius: 28,
    height: 54,
    overflow: 'hidden',
    width: '100%',
  },
  buttonGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
});
