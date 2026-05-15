import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ANDROID_EXPO_GO_NAV_BAR_PADDING = 34;
const DEFAULT_BOTTOM_PADDING = 21;

export function useBottomSafeSpacing() {
  const insets = useSafeAreaInsets();
  const androidFallback =
    Platform.OS === 'android' ? ANDROID_EXPO_GO_NAV_BAR_PADDING : DEFAULT_BOTTOM_PADDING;

  return Math.max(insets.bottom, androidFallback);
}
