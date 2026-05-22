import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppFonts } from '@/constants/theme';

type AuthButtonProps = {
  iconSource: ImageSourcePropType;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function AuthButton({ iconSource, label, onPress, style }: AuthButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}>
      <View style={styles.iconWrap}>
        <Image source={iconSource} style={styles.icon} resizeMode="contain" />
      </View>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      <View pointerEvents="none" style={styles.innerShadow} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 9,
    elevation: 4,
    gap: 24,
    justifyContent: 'center',
    maxWidth: 300,
    paddingBottom: 16,
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    width: '82%',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 24,
    position: 'absolute',
    width: 28,
  },
  icon: {
    height: 20,
    width: 20,
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9,
    boxShadow: 'inset 4px 4px 16px rgba(255, 255, 255, 0.5)',
  },
  label: {
    color: '#000000',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 26,
    letterSpacing: 0,
    paddingHorizontal: 34,
    textAlign: 'center',
    width: '100%',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
