import { Image, type ImageProps, type ImageStyle } from 'expo-image';
import { useEffect, useState } from 'react';
import type { StyleProp } from 'react-native';

import { PassageColors } from '@/constants/design';
import { coverUrl, pickActiveCoverUrl, type CoverSize } from '@/lib/image-url';
import { fetchArtwork, getCachedArtwork } from '@/lib/notification-artwork';

export type { CoverSize } from '@/lib/image-url';

type CoverImageProps = Omit<
  ImageProps,
  'source' | 'cachePolicy' | 'contentFit' | 'transition' | 'onError' | 'recyclingKey' | 'style'
> & {
  /** The original API artwork URL; this component selects and saves the suitable variant. */
  uri: string | null | undefined;
  size: CoverSize;
  style?: StyleProp<ImageStyle>;
};

/**
 * Shared soundscape/collection artwork renderer.
 *
 * Successful images are stored as local files and reused across launches by
 * cards, detail screens, the full player and notification metadata. A failed
 * requested variant falls through the other sm/md/lg files and the original.
 */
export function CoverImage({ uri, size, style, ...rest }: CoverImageProps) {
  const requestedUrl = coverUrl(uri, size);
  const cacheKey = `${size}:${uri ?? ''}`;
  const [local, setLocal] = useState<{ key: string; uri: string | null }>(() => ({
    key: cacheKey,
    uri: uri ? getCachedArtwork(uri, size) : null,
  }));
  const [cacheSettledFor, setCacheSettledFor] = useState<string | null>(
    local.uri ? cacheKey : null
  );
  const [fallbackForUri, setFallbackForUri] = useState<string | null>(null);

  useEffect(() => {
    setFallbackForUri(null);
    setCacheSettledFor(null);

    if (!uri) {
      setLocal({ key: cacheKey, uri: null });
      return;
    }

    const cached = getCachedArtwork(uri, size);
    setLocal({ key: cacheKey, uri: cached });
    if (cached) {
      setCacheSettledFor(cacheKey);
      return;
    }

    let cancelled = false;
    void fetchArtwork(uri, size).then((savedUri) => {
      if (cancelled) return;
      setLocal({ key: cacheKey, uri: savedUri });
      setCacheSettledFor(cacheKey);
    });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, size, uri]);

  const hasFallenBack = !!uri && fallbackForUri === uri;
  const localUri = local.key === cacheKey ? local.uri : null;
  // Wait for the shared downloader so Expo Image does not issue a duplicate request. If all
  // candidates fail, allow one direct request in case the server recovered in the meantime.
  const activeUrl = localUri ?? (
    cacheSettledFor === cacheKey
      ? pickActiveCoverUrl(uri, requestedUrl, fallbackForUri)
      : null
  );

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
        if (localUri) {
          // The OS can evict a cache file between our check and image decoding.
          setLocal({ key: cacheKey, uri: null });
          setCacheSettledFor(cacheKey);
          return;
        }

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
