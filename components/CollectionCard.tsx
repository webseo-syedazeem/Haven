import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoverImage } from '@/components/CoverImage';
import {
  HalcyonCardGradient,
  HalcyonCardGradientLocations,
  HalcyonColors,
  HalcyonRadius,
} from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import type { Collection } from '@/lib/api/home';

export const COLLECTION_CARD_WIDTH = 208;
export const COLLECTION_CARD_HEIGHT = 124;

type CollectionCardProps = {
  collection: Collection;
  onPress?: (collection: Collection) => void;
  width?: number;
};

export function CollectionCard({
  collection,
  onPress,
  width = COLLECTION_CARD_WIDTH,
}: CollectionCardProps) {
  const count = collection.soundscape_count ?? null;

  return (
    <Pressable
      accessibilityLabel={collection.title}
      accessibilityRole="button"
      onPress={() => onPress?.(collection)}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.cardPressed]}>
      <CoverImage size="md" style={StyleSheet.absoluteFill} uri={collection.cover_image_url} />
      <LinearGradient
        colors={HalcyonCardGradient as unknown as readonly [string, string, ...string[]]}
        locations={HalcyonCardGradientLocations as unknown as readonly [number, number, ...number[]]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {collection.title}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {count === null ? 'Collection' : `${count} ${count === 1 ? 'soundscape' : 'soundscapes'}`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    height: COLLECTION_CARD_HEIGHT,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.86,
  },
  copy: {
    padding: 14,
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  meta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
