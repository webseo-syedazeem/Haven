import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle, View } from 'react-native';

type SleepOptionCardProps = {
  compact?: boolean;
  icon: ImageSource;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  selected: boolean;
  onPress: () => void;
  softInsetShadow?: boolean;
};

const circleIcon = require('@/assets/images/circle.svg');

export function SleepOptionCard({
  compact = false,
  icon,
  label,
  labelStyle,
  selected,
  onPress,
  softInsetShadow = false,
}: SleepOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compactCard,
        softInsetShadow && styles.softInsetShadow,
        pressed && styles.pressed,
      ]}>
      <View style={styles.content}>
        <Image source={icon} style={styles.icon} contentFit="contain" />
        <Text style={[styles.label, labelStyle]}>{label}</Text>
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
    maxWidth: '100%',
    height: 57,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 17,
  },
  compactCard: {
    height: 51,
  },
  pressed: {
    opacity: 0.92,
  },
  softInsetShadow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
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
    flexShrink: 1,
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
