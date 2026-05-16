import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type SleepOptionCardProps = {
  icon: ImageSource;
  label: string;
  selected: boolean;
  onPress: () => void;
};

const circleIcon = require('@/assets/images/circle.svg');

export function SleepOptionCard({ icon, label, selected, onPress }: SleepOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.content}>
        <Image source={icon} style={styles.icon} contentFit="contain" />
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.selector}>
        <Image source={circleIcon} style={styles.circleIcon} contentFit="contain" />
        {selected ? <View style={styles.activeDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 57,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 17,
  },
  pressed: {
    opacity: 0.92,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 24,
    marginLeft: 18,
  },
  selector: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIcon: {
    width: 24,
    height: 24,
  },
  activeDot: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#7863DC',
  },
});
