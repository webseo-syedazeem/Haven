import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MINI_PLAYER_HEIGHT } from '@/components/MiniPlayer';
import { PASSAGE_TAB_BAR_HEIGHT } from '@/constants/design';
import { usePlayerState } from '@/lib/player/PlayerProvider';

const ANDROID_EXPO_GO_NAV_BAR_PADDING = 34;
const DEFAULT_BOTTOM_PADDING = 21;

export function useBottomSafeSpacing() {
  const insets = useSafeAreaInsets();
  const androidFallback =
    Platform.OS === 'android' ? ANDROID_EXPO_GO_NAV_BAR_PADDING : DEFAULT_BOTTOM_PADDING;

  return Math.max(insets.bottom, androidFallback);
}

/**
 * Bottom padding for a tab screen's scroll content: the safe area, the tab bar,
 * and the mini player when something is loaded — so the last row is never left
 * sitting under the dock.
 */
export function useTabContentInset(extra = 36) {
  const insets = useSafeAreaInsets();
  const { soundscape } = usePlayerState();

  return (
    insets.bottom + PASSAGE_TAB_BAR_HEIGHT + (soundscape ? MINI_PLAYER_HEIGHT : 0) + extra
  );
}
