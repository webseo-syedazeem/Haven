import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { useSinglePress } from '@/hooks/useSinglePress';

type OnboardingBackButtonProps = {
  color?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** The Relax-flow back button is the single back-arrow standard for onboarding. */
export function OnboardingBackButton({
  color = '#FFFFFF',
  onPress,
  style,
}: OnboardingBackButtonProps) {
  const handlePress = useSinglePress(onPress);

  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      hitSlop={12}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && styles.pressed,
      ]}>
      <Ionicons
        color={color}
        name="chevron-back"
        size={RELAX_ONBOARDING.header.backIconSize}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: RELAX_ONBOARDING.header.backButtonSize,
    justifyContent: 'center',
    width: RELAX_ONBOARDING.header.backButtonSize,
  },
  pressed: {
    opacity: 0.6,
  },
});
