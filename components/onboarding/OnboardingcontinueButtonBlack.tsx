import { Ionicons } from '@expo/vector-icons';
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
  /** Trailing arrow, off by default so existing screens are unaffected. */
  showArrow?: boolean;
  style?: StyleProp<ViewStyle>;
};


export function OnboardingContinueButtonBlack({
  disabled = false,
  label = 'Continue',
  loading = false,
  onPress,
  showArrow = false,
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
        <View style={styles.labelRow}>
          <Text style={[styles.label, showArrow && styles.labelUppercase]}>
            {label}
          </Text>
          {showArrow ? (
            <Ionicons color="#E8E1D8" name="arrow-forward" size={16} style={styles.arrow} />
          ) : null}
        </View>
      )}

    </Pressable>
  );
}


const styles = StyleSheet.create({

  arrow: {
    marginLeft: 8,
  },

  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },

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

  labelUppercase: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
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