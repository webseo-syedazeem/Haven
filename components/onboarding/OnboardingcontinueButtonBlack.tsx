import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';


type OnboardingContinueButtonProps = {
  disabled?: boolean;
  label?: string;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};


export function OnboardingContinueButtonBlack({
  disabled = false,
  label = 'Continue',
  loading = false,
  onPress,
  style,
}: OnboardingContinueButtonProps) {

  const unavailable = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: unavailable,
        busy: loading,
      }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        unavailable && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >

      {loading ? (
        <ActivityIndicator
          color={HalcyonColors.textPrimary}
          size="small"
        />
      ) : (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

    </Pressable>
  );
}


const styles = StyleSheet.create({

  button: {
    alignItems: 'center',
    justifyContent: 'center',

    height: 56,
    width: '100%',

    backgroundColor: '#151515',

    borderRadius: 18,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,

    elevation: 5,
  },


  label: {
    color: '#E8E1D8',

    fontFamily: AppFonts.sansSemiBold,

    fontSize: 16,

    fontWeight: '600',

    lineHeight: 22,

    letterSpacing: 0.2,
  },


  pressed: {
    transform: [
      {
        scale: 0.99,
      },
    ],

    opacity: 0.85,
  },


  disabled: {
    opacity: 0.45,
  },

});