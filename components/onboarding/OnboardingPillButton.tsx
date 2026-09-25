import { AppFonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

type OnboardingPillButtonProps = {
  label: string;
  variant?: 'white' | 'gold' | 'sleep' | 'lavender';
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function OnboardingPillButton({
  label,
  variant = 'white',
  onPress,
  disabled = false,
  style,
}: OnboardingPillButtonProps) {
  const isGold = variant === 'gold';
  const isSleep = variant === 'sleep' || variant === 'lavender';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSleep ? styles.sleepButton : isGold ? styles.goldButton : styles.whiteButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Ionicons color="#0B0B0D" name="arrow-forward" size={18} style={styles.icon} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 28,
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  goldButton: {
    backgroundColor: '#EAA850',
  },
  sleepButton: {
    backgroundColor: '#9FAEFD',
  },
  icon: {
    marginLeft: 10,
  },
  label: {
    color: '#0B0B0D',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  whiteButton: {
    backgroundColor: '#FFFFFF',
  },
});
