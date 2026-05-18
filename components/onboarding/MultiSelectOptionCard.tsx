import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text, type TextStyle, View } from 'react-native';

type MultiSelectOptionCardProps = {
  icon: ImageSource;
  label: string;
  selected: boolean;
  onPress: () => void;
};

const selectedCheckIcon = require('@/assets/images/list.svg');

export function MultiSelectOptionCard({ icon, label, selected, onPress }: MultiSelectOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.selectedCard : styles.unselectedCard,
        pressed && styles.pressed,
      ]}>
      <View style={styles.content}>
        <Image source={icon} style={styles.icon} contentFit="contain" />
        <Text numberOfLines={1} style={styles.label}>
          {label}
        </Text>
      </View>

      {selected ? <Image source={selectedCheckIcon} style={styles.checkIcon} contentFit="contain" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    flexBasis: '48.4%',
    maxWidth: '48.4%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 10,
  },
  unselectedCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'transparent',
  },
  selectedCard: {
    backgroundColor: '#7B61FF14',
    borderColor: '#7B61FF',
  },
  pressed: {
    opacity: 0.92,
  },
  content: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  label: {
    flex: 1,
    fontFamily: 'SF Pro',
    fontWeight: '510' as TextStyle['fontWeight'],
    fontSize: 14,
    lineHeight: 22,
    color: '#54555A',
  },
  checkIcon: {
    width: 24,
    height: 24,
  },
});
