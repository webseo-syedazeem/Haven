import { Image, type ImageProps, type ImageStyle } from 'expo-image';
import { useEffect, useState } from 'react';
import type { StyleProp } from 'react-native';

import { PassageColors } from '@/constants/design';
import { coverUrl, pickActiveCoverUrl, type CoverSize } from '@/lib/image-url';

export type { CoverSize } from '@/lib/image-url';

type CoverImageProps = Omit<
  ImageProps,
  'source' | 'cachePolicy' | 'contentFit' | 'transition' | 'onError' | 'recyclingKey' | 'style'
> & {
  /** The ORIGINAL (non-variant) cover URL — e.g. `soundscape.artwork_url` or
   * `collection.cover_image_url`. `CoverImage` picks the right-sized variant itself. */
  uri: string | null | undefined;
  /** Which resized variant to request. See lib/image-url.ts for the size thresholds used
   * across the app: sm <=160dp, md for larger cards/hero rails/detail heroes, lg for
   * full-screen player artwork. */
  size: CoverSize;
  style?: StyleProp<ImageStyle>;
};

/**
 * Shared cover-image renderer for every soundscape/collection cover in the app (rail cards,
 * rows, collection cards, detail heroes, mini-player, full player). Not used for local bundled
 * assets (e.g. mode backgrounds) or for notification/lock-screen artwork — see
 * lib/notification-artwork.ts, which stays untouched.
 *
 * - Requests the `sm`/`md`/`lg` resized variant instead of the (sometimes ~1.8MB) original.
 * - Falls back to the original URL exactly once if the variant 404s (e.g. an image saved
 *   before variants existed, or not yet backfilled) — never loops or retries further.
 * - Dark placeholder background so there is never a white flash or layout jump.
 * - Stable `recyclingKey` derived from the original URL so FlatList/FlashList item recycling
 *   does not cause refetching or flicker.
 */
export function CoverImage({ uri, size, style, ...rest }: CoverImageProps) {
  const requestedUrl = coverUrl(uri, size);
  // Keyed by which *original* URL it was for, so a recycled list item (different `uri`) always
  // gets a clean attempt at its own variant instead of inheriting a sibling's fallback state.
  const [fallbackForUri, setFallbackForUri] = useState<string | null>(null);

  useEffect(() => {
    setFallbackForUri(null);
  }, [uri]);

  const hasFallenBack = !!uri && fallbackForUri === uri;
  const activeUrl = pickActiveCoverUrl(uri, requestedUrl, fallbackForUri);

  if (!activeUrl) {
    return <Image cachePolicy="memory-disk" style={[placeholderStyle, style]} {...rest} />;
  }

  return (
    <Image
      cachePolicy="memory-disk"
      contentFit="cover"
      transition={150}
      recyclingKey={uri ?? undefined}
      source={{ uri: activeUrl }}
      style={[placeholderStyle, style]}
      onError={() => {
        // Only fall back once: if the variant URL failed and we have not already swapped to
        // the original for this exact uri, swap now. If the original itself then fails too,
        // this does not fire again (activeUrl === uri already, nothing left to change).
        if (!hasFallenBack && activeUrl !== uri && uri) {
          setFallbackForUri(uri);
        }
      }}
      {...rest}
    />
  );
}

const placeholderStyle: StyleProp<ImageStyle> = {
  backgroundColor: PassageColors.surfaceRaised,
};
