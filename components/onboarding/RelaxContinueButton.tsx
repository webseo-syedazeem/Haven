import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { RELAX_ACCENT, RELAX_ACCENT_PRESSED } from '@/constants/design';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';

type SharedButtonProps = ComponentProps<typeof OnboardingContinueButton>;
type RelaxContinueButtonProps = Pick<
  SharedButtonProps,
  'disabled' | 'label' | 'loading' | 'onPress' | 'style'
>;

/** The shared green CTA treatment for Relax onboarding. */
export function RelaxContinueButton({
  disabled,
  label,
  loading,
  onPress,
  style,
}: RelaxContinueButtonProps) {
  return (
    <OnboardingContinueButton
      accentColor={RELAX_ACCENT}
      accentPressedColor={RELAX_ACCENT_PRESSED}
      disabled={disabled}
      label={label}
      loading={loading}
      onPress={onPress}
      showArrow
      style={[styles.button, style]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: RELAX_ONBOARDING.button.height,
    opacity: 1,
  },
});
