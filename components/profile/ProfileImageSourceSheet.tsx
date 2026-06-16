import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EXPLORE_GRADIENT_COLORS, EXPLORE_GRADIENT_LOCATIONS, ExploreGradientFill } from '@/components/explore-gradient';
import { ExploreButton } from '@/components/ExploreButton';
import { useScreenBottomPadding } from '@/components/ScreenWrapper';
import { AppFonts } from '@/constants/theme';

type ProfileImageSourceSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPickCamera: () => void;
  onPickFiles: () => void;
};

type ActionTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  onPress: () => void;
  gradientColors: readonly [string, string, ...string[]];
  gradientLocations?: readonly [number, number, ...number[]];
  destructive?: boolean;
};

function ActionTile({
  icon,
  label,
  hint,
  onPress,
  gradientColors,
  gradientLocations = EXPLORE_GRADIENT_LOCATIONS,
  destructive,
}: ActionTileProps) {
  const radius = 28;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}>
      <View style={[styles.tileIconOuter, destructive && styles.tileIconOuterDestructive]}>
        {destructive ? (
          <LinearGradient
            colors={gradientColors}
            end={{ x: 1, y: 1 }}
            locations={gradientLocations}
            start={{ x: 0, y: 0 }}
            style={[styles.tileIconGradient, { borderRadius: radius }]}>
            <Ionicons color="#FFFFFF" name={icon} size={26} />
          </LinearGradient>
        ) : (
          <View style={[styles.tileIconGradient, { borderRadius: radius }]}>
            <ExploreGradientFill borderRadius={radius} colors={gradientColors} locations={gradientLocations} />
            <Ionicons color="#FFFFFF" name={icon} size={26} style={styles.tileIcon} />
          </View>
        )}
      </View>
      <Text style={[styles.tileLabel, destructive && styles.tileLabelDestructive]}>{label}</Text>
      <Text style={styles.tileHint}>{hint}</Text>
    </Pressable>
  );
}

export function ProfileImageSourceSheet({
  visible,
  onClose,
  onPickCamera,
  onPickFiles,
}: ProfileImageSourceSheetProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = useScreenBottomPadding();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.overlay}>
        <View pointerEvents="none" style={[styles.statusBarDim, { height: insets.top }]} />
        <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.backdrop} />

        <View style={[styles.sheet, { paddingBottom: bottomPadding }]}>
          <LinearGradient
            colors={['rgba(99,57,251,0.08)', 'rgba(255,255,255,0)']}
            end={{ x: 0.5, y: 1 }}
            start={{ x: 0.5, y: 0 }}
            style={styles.sheetGlow}
          />

          <View style={styles.handle} />

          <View style={styles.headerBadge}>
            <View style={styles.headerBadgeInner}>
              <ExploreGradientFill borderRadius={22} />
              <Ionicons color="#FFFFFF" name="image-outline" size={22} style={styles.headerBadgeIcon} />
            </View>
          </View>

          <Text style={styles.title}>Update your photo</Text>
          <Text style={styles.subtitle}>Pick the option that works best for you</Text>

          <View style={styles.tilesRow}>
            <ActionTile
              gradientColors={EXPLORE_GRADIENT_COLORS}
              gradientLocations={EXPLORE_GRADIENT_LOCATIONS}
              hint="Take a new shot"
              icon="camera-outline"
              label="Camera"
              onPress={onPickCamera}
            />
            <ActionTile
              gradientColors={['#7863DC', '#B087E5']}
              gradientLocations={[0, 1]}
              hint="From your device"
              icon="images-outline"
              label="Gallery"
              onPress={onPickFiles}
            />
          </View>

          <ExploreButton label="Not now" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(23, 63, 95, 0.48)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  statusBarDim: {
    backgroundColor: 'rgba(23, 63, 95, 0.48)',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingTop: 10,
    shadowColor: '#6339FB',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  sheetGlow: {
    height: 120,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(99,57,251,0.22)',
    borderRadius: 4,
    height: 5,
    marginBottom: 18,
    width: 48,
  },
  headerBadge: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerBadgeInner: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
  },
  headerBadgeIcon: {
    position: 'relative',
    zIndex: 1,
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: '#F8F7FC',
    borderColor: 'rgba(99,57,251,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minHeight: 132,
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  tilePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  tileIconOuter: {
    marginBottom: 10,
    shadowColor: '#6339FB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  tileIconOuterDestructive: {
    shadowColor: '#FF0059',
  },
  tileIconGradient: {
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56,
  },
  tileIcon: {
    position: 'relative',
    zIndex: 1,
  },
  tileLabel: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  tileLabelDestructive: {
    color: '#FF0059',
  },
  tileHint: {
    color: '#9A9A9A',
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
    textAlign: 'center',
  },
});
