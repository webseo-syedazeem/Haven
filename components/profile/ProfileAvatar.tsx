import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type ProfileAvatarProps = {
  imageUrl?: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  placeholderBackgroundColor?: string;
};

export function ProfileAvatar({
  imageUrl,
  size,
  style,
  iconColor = '#9A9A9A',
  placeholderBackgroundColor = '#FFFFFF',
}: ProfileAvatarProps) {
  const radius = size / 2;
  const hasImage = !!imageUrl?.trim();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: hasImage ? '#FFFFFF' : placeholderBackgroundColor,
        },
        !hasImage && styles.placeholder,
        style,
      ]}>
      {hasImage ? (
        <Image
          contentFit="cover"
          cachePolicy="memory-disk"
          source={{ uri: imageUrl! }}
          style={{ width: size, height: size, borderRadius: radius }}
        />
      ) : (
        <Ionicons color={iconColor} name="person" size={Math.round(size * 0.48)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholder: {},
});
