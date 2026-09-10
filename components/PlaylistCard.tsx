import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import type { Playlist } from '@/lib/api/playlists';

type PlaylistCardProps = {
  playlist: Playlist;
  /** Artwork from the playlist's first few tracks, when it has no cover. */
  collage?: string[];
  onPress?: (playlist: Playlist) => void;
  width: number;
};

export function PlaylistCard({ playlist, collage = [], onPress, width }: PlaylistCardProps) {
  const count = playlist.item_count ?? 0;
  const tiles = collage.slice(0, 4);

  return (
    <Pressable
      accessibilityLabel={playlist.name}
      accessibilityRole="button"
      onPress={() => onPress?.(playlist)}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
      <View style={[styles.artworkFrame, { height: width, width }]}>
        {playlist.cover_image_url ? (
          <Image
            contentFit="cover"
            cachePolicy="memory-disk"
            source={{ uri: playlist.cover_image_url }}
            style={styles.cover}
            transition={200}
          />
        ) : tiles.length > 0 ? (
          <View style={styles.collage}>
            {tiles.map((uri, index) => (
              <Image
                contentFit="cover"
                key={`${uri}-${index}`}
                cachePolicy="memory-disk"
                source={{ uri }}
                style={[styles.tile, tiles.length === 1 && styles.tileSolo]}
                transition={180}
              />
            ))}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons color={HalcyonColors.textSecondary} name="musical-notes-outline" size={26} />
          </View>
        )}
      </View>

      <Text numberOfLines={1} style={styles.title}>
        {playlist.name}
      </Text>
      <Text style={styles.meta}>
        {count} {count === 1 ? 'sound' : 'sounds'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.84,
  },
  artworkFrame: {
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.artwork,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cover: {
    height: '100%',
    width: '100%',
  },
  collage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: '100%',
    width: '100%',
  },
  tile: {
    height: '50%',
    width: '50%',
  },
  tileSolo: {
    height: '100%',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surfaceRaised,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: 10,
  },
  meta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
