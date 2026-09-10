import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  type ImageSourcePropType,
} from 'react-native';

import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

type AuthSocialButtonProps = {
  disabled?: boolean;
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
};

export function AuthSocialButton({
  disabled = false,
  icon,
  label,
  onPress,
}: AuthSocialButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={'button'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Image resizeMode={'contain'} source={icon} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: 'rgba(255,255,255,0.11)',
    borderRadius: HalcyonRadius.artwork,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 46,
    position: 'relative',
    width: '100%',
  },
  disabled: { opacity: 0.46 },
  icon: {
    height: 18,
    left: 18,
    position: 'absolute',
    width: 18,
  },
  label: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  pressed: {
    backgroundColor: HalcyonColors.surfaceRaised,
    opacity: 0.84,
  },
});
