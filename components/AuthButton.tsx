import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

type AuthButtonProps = {
  disabled?: boolean;
  iconSource: ImageSourcePropType;
  iconTintColor?: string;
  label: string;
  loading?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function AuthButton({
  disabled = false,
  iconSource,
  iconTintColor,
  label,
  loading = false,
  onPress,
  style,
}: AuthButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}>
      <View style={styles.iconWrap}>
        {loading ? (
          <ActivityIndicator color={HalcyonColors.accent} size="small" />
        ) : (
          <Image
            resizeMode="contain"
            source={iconSource}
            style={[styles.icon, iconTintColor ? { tintColor: iconTintColor } : null]}
          />
        )}
      </View>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      <View style={styles.rightSpacer} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 16,
    width: '100%',
  },
  disabled: { opacity: 0.52 },
  icon: { height: 19, width: 19 },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  label: {
    color: HalcyonColors.textPrimary,
    flex: 1,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  pressed: {
    backgroundColor: HalcyonColors.surfaceRaised,
    transform: [{ scale: 0.995 }],
  },
  rightSpacer: { width: 28 },
});
