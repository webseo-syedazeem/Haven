import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { wellnessColors, wellnessTypography } from '@/constants/wellness-theme';

type MoodOptionProps = {
  icon: ImageSource;
  label: string;
};

export function MoodOption({ icon, label }: MoodOptionProps) {
  return (
    <View style={styles.container}>
      <Image source={icon} style={styles.icon} contentFit="contain" />
      <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '25%',
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
    minWidth: 80,
    textAlign: 'center',
  },
});
