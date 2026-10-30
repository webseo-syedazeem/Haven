import { AppFonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { PassageRadius } from '@/constants/design';
import { useSinglePress } from '@/hooks/useSinglePress';

type OnboardingPillButtonProps = {
  arrowAtEnd?: boolean;
  label: string;
  variant?: 'white' | 'gold' | 'sleep' | 'lavender';
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function OnboardingPillButton({
  arrowAtEnd = false,
  label,
  variant = 'white',
  onPress,
  disabled = false,
  style,
}: OnboardingPillButtonProps) {
  const isGold = variant === 'gold';
  const isSleep = variant === 'sleep' || variant === 'lavender';
  const handlePress = useSinglePress(onPress);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        isSleep ? styles.sleepButton : isGold ? styles.goldButton : styles.whiteButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={[styles.content, arrowAtEnd && styles.contentWithEndArrow]}>
        <Text style={styles.label}>{label}</Text>
        <Ionicons
          color="#0B0B0D"
          name="arrow-forward"
          size={20}
          style={arrowAtEnd ? styles.iconAtEnd : styles.iconInline}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: PassageRadius.pill,
    justifyContent: 'center',
    minHeight: 60,
    paddingHorizontal: 20,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  contentWithEndArrow: {
    position: 'relative',
    width: '100%',
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
  iconAtEnd: {
    position: 'absolute',
    right: 0,
  },
  iconInline: {
    marginLeft: 8,
  },
  label: {
    color: '#0B0B0D',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.8,
    lineHeight: 22,
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
