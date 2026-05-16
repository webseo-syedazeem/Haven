import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text } from 'react-native';

import { wellnessColors, wellnessTypography } from '@/constants/wellness-theme';

type MoodOptionProps = {
  icon: ImageSource;
  label: string;
  onPress?: () => void;
};

export function MoodOption({ icon, label, onPress }: MoodOptionProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.container}>
      <Image source={icon} style={styles.icon} contentFit="contain" />
      <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '25%',
    maxWidth: '25%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  icon: {
    width: 44,
    height: 44,
  },
  label: {
    ...wellnessTypography.moodLabel,
    color: wellnessColors.text,
    marginTop: 6,
    width: '100%',
    textAlign: 'center',
  },
});
