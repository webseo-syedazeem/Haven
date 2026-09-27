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

import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useSinglePress } from '@/hooks/useSinglePress';


type OnboardingContinueButtonProps = {
  disabled?: boolean;
  label?: string;
  loading?: boolean;
  onPress?: () => void;
  /** Onboarding CTAs use the same trailing-arrow treatment throughout. */
  showArrow?: boolean;
  style?: StyleProp<ViewStyle>;
};


export function OnboardingContinueButtonBlack({
  disabled = false,
  label = 'Continue',
  loading = false,
  onPress,
  showArrow = true,
  style,
}: OnboardingContinueButtonProps) {

  const unavailable = disabled || loading;
  const handlePress = useSinglePress(onPress);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: unavailable,
        busy: loading,
      }}
      disabled={unavailable}
      onPress={handlePress}
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
            <Ionicons color="#E8E1D8" name="arrow-forward" size={20} style={styles.arrow} />
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

    minHeight: 60,
    width: '100%',

    backgroundColor: '#151515',

    borderRadius: HalcyonRadius.pill,
    paddingHorizontal: 20,

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
  },

  labelUppercase: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },


  pressed: {
    transform: [
      {
        scale: 0.995,
      },
    ],

    opacity: 0.85,
  },


  disabled: {
    opacity: 0.45,
  },

});
