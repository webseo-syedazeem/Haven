import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoverImage } from '@/components/CoverImage';
import { PassageColors, PassageRadius } from '@/constants/design';
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
          <CoverImage size="md" style={styles.cover} uri={playlist.cover_image_url} />
        ) : tiles.length > 0 ? (
          <View style={styles.collage}>
            {tiles.map((uri, index) => (
              <CoverImage
                key={`${uri}-${index}`}
                size="sm"
                style={[styles.tile, tiles.length === 1 && styles.tileSolo]}
                uri={uri}
              />
            ))}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons color={PassageColors.textSecondary} name="musical-notes-outline" size={26} />
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
    backgroundColor: PassageColors.surface,
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.artwork,
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
    backgroundColor: PassageColors.surfaceRaised,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: 10,
  },
  meta: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
