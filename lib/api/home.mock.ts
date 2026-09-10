import { Asset } from 'expo-asset';

import type { Collection, ContinueListeningItem, Favourite, Soundscape } from './home';

/**
 * Sample catalogue used only when `USE_MOCK_HOME` is on, so the Home screen can
 * be reviewed fully populated. Artwork points at bundled assets, so nothing here
 * needs the network.
 */
const artwork = {
  forest: Asset.fromModule(require('@/assets/images/welcome-page-background.webp')).uri,
  night: Asset.fromModule(require('@/assets/images/environment-background.webp')).uri,
  dusk: Asset.fromModule(require('@/assets/images/what-make-unique-background.webp')).uri,
  ember: Asset.fromModule(require('@/assets/images/how-it-works-background.webp')).uri,
};

const SOUNDSCAPES: Soundscape[] = [
  {
    id: 'mock-forest-mist',
    title: 'Forest Mist',
    one_line_description:
      'A gentle forest ambience with soft birdsong and distant water. Designed to help you focus and get things done.',
    artwork_url: artwork.forest,
    mode: 'focus',
    duration_seconds: 2700,
    play_count: 1240,
  },
  {
    id: 'mock-morning-light',
    title: 'Morning Light',
    one_line_description: 'Warm dawn air, slow and open, for an unhurried start.',
    artwork_url: artwork.dusk,
    mode: 'relax',
    duration_seconds: 1800,
    play_count: 860,
  },
  {
    id: 'mock-deep-focus',
    title: 'Deep Focus',
    one_line_description: 'Steady low detail texture that stays out of the way of deep work.',
    artwork_url: artwork.night,
    mode: 'focus',
    duration_seconds: 3600,
    play_count: 2130,
  },
  {
    id: 'mock-calm-river',
    title: 'Calm River',
    one_line_description: 'Moving water with a soft bank of trees behind it.',
    artwork_url: artwork.ember,
    mode: 'relax',
    duration_seconds: 2700,
    play_count: 540,
  },
  {
    id: 'mock-night-cabin',
    title: 'Night Cabin',
    one_line_description: 'Rain on a wooden roof, banked fire, nothing else to do.',
    artwork_url: artwork.forest,
    mode: 'sleep',
    duration_seconds: 5400,
    play_count: 1710,
  },
  {
    id: 'mock-short-reset',
    title: 'Short Reset',
    one_line_description: 'Five quiet minutes between two busy things.',
    artwork_url: artwork.dusk,
    mode: 'relax',
    duration_seconds: 300,
    play_count: 320,
  },
];

export function mockSoundscapes(rail: 'recommended' | 'recent' | 'new' | 'short'): Soundscape[] {
  switch (rail) {
    case 'recent':
      return [SOUNDSCAPES[2], SOUNDSCAPES[4], SOUNDSCAPES[0]];
    case 'new':
      return [SOUNDSCAPES[4], SOUNDSCAPES[3], SOUNDSCAPES[1]];
    case 'short':
      return [SOUNDSCAPES[5], SOUNDSCAPES[1], SOUNDSCAPES[3]];
    default:
      return SOUNDSCAPES.slice(0, 4);
  }
}

export function mockContinueListening(): ContinueListeningItem[] {
  return [
    {
      soundscape: SOUNDSCAPES[0],
      position_seconds: 1455,
      duration_seconds: SOUNDSCAPES[0].duration_seconds ?? null,
      updated_at: new Date().toISOString(),
    },
  ];
}

export function mockFavourites(): Favourite[] {
  return [SOUNDSCAPES[1], SOUNDSCAPES[4]].map((soundscape, index) => ({
    id: `mock-fav-${index}`,
    soundscape_id: soundscape.id,
    created_at: new Date().toISOString(),
    soundscape,
  }));
}

export function mockCollections(): Collection[] {
  return [
    {
      id: 'mock-collection-late-night',
      slug: 'late-night',
      title: 'Late Night',
      description: 'For the hours after everyone else has gone to bed.',
      cover_image_url: artwork.night,
      soundscape_count: 6,
    },
  ];
}
