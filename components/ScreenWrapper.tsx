import {
  ImageBackground,
  type ImageStyle,
  Platform,
  StyleSheet,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

const ANDROID_NAV_FALLBACK = 34;
const BOTTOM_SAFE_GAP = 24;
const DEFAULT_BOTTOM_RESERVE = 150;
const backgroundImageStyle = Platform.select({
  web: { objectPosition: 'center center' } as unknown as ImageStyle,
  default: undefined,
});

type ScreenWrapperProps = {
  backgroundImage: ImageSourcePropType;
  bottomContent?: ReactNode;
  bottomReserve?: number;
  bottomContentStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
  contentWrapperStyle?: StyleProp<ViewStyle>;
  middleContent?: ReactNode;
  middleContentStyle?: StyleProp<ViewStyle>;
  overlay?: ReactNode;
  topContent?: ReactNode;
  topContentStyle?: StyleProp<ViewStyle>;
};

export function ScreenWrapper({
  backgroundImage,
  bottomContent,
  bottomReserve = DEFAULT_BOTTOM_RESERVE,
  bottomContentStyle,
  children,
  contentWrapperStyle,
  middleContent,
  middleContentStyle,
  overlay,
  topContent,
  topContentStyle,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = useScreenBottomPadding();

  return (
    <ImageBackground
      imageStyle={backgroundImageStyle}
      source={backgroundImage}
      resizeMode="cover"
      style={styles.background}>
      {overlay}
      <View style={[styles.safeOuter, { paddingTop: insets.top }]}>
        {children ?? (
          <View style={[styles.contentWrapper, contentWrapperStyle]}>
            <View style={topContentStyle}>{topContent}</View>
            <View
              style={[
                styles.middleContent,
                { paddingBottom: bottomReserve },
                middleContentStyle,
              ]}>
              {middleContent}
            </View>
            <View
              style={[
                styles.bottomContent,
                { paddingBottom: bottomPadding },
                bottomContentStyle,
              ]}>
              {bottomContent}
            </View>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

export function useScreenBottomPadding() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? ANDROID_NAV_FALLBACK : 0);

  return bottomInset + BOTTOM_SAFE_GAP;
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  bottomContent: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    width: '100%',
  },
  contentWrapper: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  middleContent: {
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
    minHeight: 0,
    width: '100%',
  },
  safeOuter: {
    flex: 1,
    minHeight: 0,
  },
});
