import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MINI_PLAYER_HEIGHT } from '@/components/MiniPlayer';
import { PASSAGE_TAB_BAR_HEIGHT, PassageColors, PassageSpacing } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { usePlayerState } from '@/lib/player/PlayerProvider';

type ComingSoonScreenProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  message?: string;
};

/** Dark placeholder used by the tabs that are not built yet. */
export function ComingSoonScreen({
  title,
  icon,
  message = "We're working on something beautiful.",
}: ComingSoonScreenProps) {
  const { soundscape } = usePlayerState();
  const dockHeight = PASSAGE_TAB_BAR_HEIGHT + (soundscape ? MINI_PLAYER_HEIGHT : 0);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={[styles.content, { paddingBottom: dockHeight }]}>
          <View style={styles.iconCircle}>
            <Ionicons color={PassageColors.textSecondary} name={icon} size={30} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Coming soon</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: PassageColors.background,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: PassageSpacing.screenX,
  },
  iconCircle: {
    alignItems: 'center',
    borderColor: PassageColors.border,
    borderRadius: 36,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: 22,
    width: 72,
  },
  title: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginTop: 6,
    textAlign: 'center',
  },
  message: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 260,
    textAlign: 'center',
  },
});
