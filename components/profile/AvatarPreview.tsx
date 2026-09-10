import { BlurView } from 'expo-blur';
import { Dimensions, Image, Modal, Pressable, StyleSheet, View } from 'react-native';

type AvatarPreviewProps = {
  visible: boolean;
  imageUrl?: string | null;
  onClose: () => void;
};

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.78, 320);

export function AvatarPreview({ visible, imageUrl, onClose }: AvatarPreviewProps) {
  if (!imageUrl) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.circleWrap}>
          <Image resizeMode="cover" source={{ uri: imageUrl }} style={styles.image} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    flex: 1,
    justifyContent: 'center',
  },
  circleWrap: {
    backgroundColor: '#222222',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 3,
    height: CIRCLE_SIZE,
    overflow: 'hidden',
    width: CIRCLE_SIZE,
  },
  image: {
    height: '100%',
    width: '100%',
  },
});
