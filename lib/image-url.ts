/**
 * Rewrites a passage_soundscape_images_webp cover URL to point at a resized variant served by
 * the backend (see Backend local/lib/imageVariants.js + server.ts), so the app requests a
 * right-sized image instead of the up-to-~1.8MB master copy for every card.
 *
 * Only touches URLs whose path contains `/passage_soundscape_images_webp/` and that are not
 * already inside a variant folder. Everything else — null, undefined, URLs on other hosts,
 * local `file://` URIs, or URLs already rewritten to sm/md/lg — is returned completely
 * unchanged. Never throws.
 */

export type CoverSize = 'sm' | 'md' | 'lg' | 'original';

const COVER_IMAGES_MARKER = '/passage_soundscape_images_webp/';
const VARIANT_DIR_NAMES = new Set<string>(['sm', 'md', 'lg']);

const FALLBACK_ORDER: Record<CoverSize, CoverSize[]> = {
  sm: ['sm', 'md', 'lg'],
  md: ['md', 'lg', 'sm'],
  lg: ['lg', 'md', 'sm'],
  original: ['lg', 'md', 'sm'],
};

export function coverUrl(
  url: string | null | undefined,
  size: CoverSize
): string | null | undefined {
  if (!url) return url;
  if (size === 'original') return url;

  try {
    const markerIndex = url.indexOf(COVER_IMAGES_MARKER);
    if (markerIndex === -1) return url; // Not a passage_soundscape_images_webp URL at all.

    const afterMarker = url.slice(markerIndex + COVER_IMAGES_MARKER.length);
    const nextSlashIndex = afterMarker.indexOf('/');

    if (nextSlashIndex !== -1) {
      const firstSegment = afterMarker.slice(0, nextSlashIndex);
      if (VARIANT_DIR_NAMES.has(firstSegment)) {
        // Already `.../passage_soundscape_images_webp/sm|md|lg/<filename>` — never
        // double-rewrite (e.g. would otherwise produce `.../sm/sm/<filename>`).
        return url;
      }
      // An unexpected nested path under the images folder. Leave unchanged rather than guess.
      return url;
    }

    // `.../passage_soundscape_images_webp/<filename>` — the plain original. Insert the variant
    // folder immediately before the filename.
    const prefix = url.slice(0, markerIndex + COVER_IMAGES_MARKER.length);
    return `${prefix}${size}/${afterMarker}`;
  } catch {
    return url;
  }
}

/** Ordered download choices: requested size, sibling sizes, then the original. */
export function coverCandidateUrls(
  url: string | null | undefined,
  size: CoverSize
): string[] {
  if (!url) return [];

  try {
    const markerIndex = url.indexOf(COVER_IMAGES_MARKER);
    if (markerIndex === -1) return [url];

    const prefix = url.slice(0, markerIndex + COVER_IMAGES_MARKER.length);
    const segments = url.slice(prefix.length).split('/');
    let filename: string;

    if (segments.length === 1) {
      filename = segments[0];
    } else if (segments.length === 2 && VARIANT_DIR_NAMES.has(segments[0])) {
      filename = segments[1];
    } else {
      return [url];
    }

    if (!filename) return [url];

    const original = `${prefix}${filename}`;
    const variants = FALLBACK_ORDER[size].map((variant) => `${prefix}${variant}/${filename}`);
    return size === 'original' ? [original, ...variants] : [...variants, original];
  } catch {
    return [url];
  }
}

/**
 * Files allowed to bypass the network on first render.
 *
 * The full player is quality-first: a cached resized image must not prevent an
 * original request. Resized files become eligible only after that request
 * fails inside `fetchArtwork`. Other surfaces remain performance-first and may
 * immediately reuse any already-downloaded compatible size.
 */
export function initialCachedCoverUrls(
  url: string | null | undefined,
  size: CoverSize
): string[] {
  const candidates = coverCandidateUrls(url, size);
  return size === 'original' ? candidates.slice(0, 1) : candidates;
}

/**
 * Pure decision logic behind `<CoverImage>`'s one-time fallback-to-original behavior (see
 * components/CoverImage.tsx), factored out so it is unit-testable without a React component
 * renderer — this project has no Jest / React Native Testing Library set up (tests run via
 * plain `node --test`), so a full render-and-fire-onError test is not feasible here. This
 * covers the actual branching the component relies on instead.
 *
 * `fallbackForUri` is the original `uri` CoverImage has already fallen back to for (or `null`
 * if nothing has failed yet). Returns the URL that should actually be requested right now:
 * - If this exact item already fell back, keep using the original (never re-attempt the
 *   variant, and never re-fall-back past the original).
 * - Otherwise, prefer the requested variant, falling back to the original only if no variant
 *   URL could be produced (e.g. a non-passage_soundscape_images_webp URL, where coverUrl
 *   returns the input unchanged and the two are already the same value).
 * - A `fallbackForUri` left over from a *different* uri (e.g. a recycled list item) is ignored
 *   — each item gets its own fresh attempt at its own variant.
 */
export function pickActiveCoverUrl(
  uri: string | null | undefined,
  requestedUrl: string | null | undefined,
  fallbackForUri: string | null
): string | null | undefined {
  const hasFallenBackForThisUri = !!uri && fallbackForUri === uri;
  if (hasFallenBackForThisUri) return uri;
  return requestedUrl ?? uri;
}
