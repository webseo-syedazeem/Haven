import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppFonts } from '@/constants/theme';
import { useDailyEase } from '@/contexts/DailyEaseContext';
import { useUser } from '@/hooks/useUser';
import { getDisplayName } from '@/lib/api/user';

const CHECK_ICON = require('@/assets/images/done.svg');
const LEAF_ICON = require('@/assets/images/leves.svg');

function getStressStatus(value: number) {
  if (value <= 3) {
    return 'Normal';
  }

  if (value >= 4 && value <= 6) {
    return 'Medium';
  }

  return 'High';
}

export function ThankYouScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dailyEase } = useDailyEase();
  const params = useLocalSearchParams<{ stress?: string }>();
  const { data: me } = useUser();
  const displayName = getDisplayName(me) || 'there';
  const parsedStress = Number(params.stress);
  const stressValue = Number.isFinite(parsedStress)
    ? Math.min(10, Math.max(0, Math.round(parsedStress)))
    : 7;
  const summaryStats = [
    { id: 'stress-today', label: 'Stress Today', status: getStressStatus(stressValue), value: String(stressValue) },
    { id: 'daily-ease', label: 'Daily Ease', value: String(dailyEase.score), status: dailyEase.label, accent: true },
  ];

  return (
    <View style={styles.screen}>
      <ScreenWrapper
        backgroundImage={require('@/assets/images/thankyou_page.png')}
        bottomReserve={0}
        overlay={
          <LinearGradient
            colors={['rgba(244, 245, 249, 0)', '#FFFFFF']}
            locations={[0.4871, 0.7218]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.backgroundFade}
          />
        }>
        <View style={styles.contentShell}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Image source={CHECK_ICON} style={styles.checkIcon} contentFit="contain" />
              <Text allowFontScaling={false} style={styles.heading}>
                Thanks {displayName}!
              </Text>
              <Text allowFontScaling={false} style={styles.subtitle}>
                Your reflection helps Heaven understand your pattern
              </Text>
            </View>

            <View style={styles.statsRow}>
              {summaryStats.map((stat) => (
                <View key={stat.id} style={styles.statCard}>
                  <Text allowFontScaling={false} style={styles.statLabel}>
                    {stat.label}
                  </Text>
                  {stat.id === 'stress-today' ? (
                    <View style={styles.stressValueRow}>
                      <Text allowFontScaling={false} style={styles.statValue}>
                        {stat.value}
                      </Text>
                      <Text allowFontScaling={false} style={styles.statValueSmall}>
                        /10
                      </Text>
                    </View>
                  ) : (
                    <Text allowFontScaling={false} style={styles.statValue}>
                      {stat.value}
                    </Text>
                  )}
                  <Text
                    allowFontScaling={false}
                    style={[styles.statStatus, stat.accent && styles.statStatusAccent]}>
                    {stat.status}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.supportCard}>
              <View style={styles.leafIconCircle}>
                <Image source={LEAF_ICON} style={styles.leafIcon} contentFit="contain" />
              </View>
              <View style={styles.supportTextWrap}>
                <Text allowFontScaling={false} style={styles.supportText}>
                  Even on higher day your body still need support
                </Text>
                <Text allowFontScaling={false} style={styles.supportGreenText}>
                  Small steps, real changes
                </Text>
              </View>
            </View>

          </ScrollView>
          <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + 24 }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/(tabs)')}
              style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
              <LinearGradient
                colors={['#5AA1E2', '#0D6FD0']}
                end={{ x: 0, y: 1 }}
                locations={[0.0379, 0.75]}
                start={{ x: 0, y: 0 }}
                style={styles.continueGradient}>
                <View pointerEvents="none" style={styles.innerShadow}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                    end={{ x: 0, y: 1 }}
                    start={{ x: 0, y: 0 }}
                    style={styles.innerShadowTop}
                  />
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                    end={{ x: 1, y: 0 }}
                    start={{ x: 0, y: 0 }}
                    style={styles.innerShadowLeft}
                  />
                </View>
                <Text style={styles.continueText}>Done</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#8E78D8',
  },
  backgroundFade: {
    ...StyleSheet.absoluteFillObject,
  },
  contentShell: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 27,
  },
  checkIcon: {
    width: 104,
    height: 104,
    marginBottom: 21,
  },
  heading: {
    fontFamily: AppFonts.displaySemiBold,
    fontWeight: '600',
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    maxWidth: 270,
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 27,
  },
  statCard: {
    flex: 1,
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  statLabel: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 26,
    textAlign: 'center',
    color: '#000000',
  },
  stressValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 30,
    lineHeight: 34,
    textAlign: 'center',
    color: '#000000',
  },
  statValueSmall: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 24,
    color: '#000000',
  },
  statStatus: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 26,
    textAlign: 'center',
    color: '#000000',
  },
  statStatusAccent: {
    color: '#7B61FF',
  },
  supportCard: {
    width: '100%',
    minHeight: 86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  leafIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2EB6681F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  leafIcon: {
    width: 22,
    height: 22,
  },
  supportTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  supportText: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#54555A',
  },
  supportGreenText: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 22,
    color: '#2EB668',
    marginTop: 2,
  },
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    width: '100%',
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: '#0d6fd0',
    borderRadius: 27,
    elevation: 0,
    height: 54,
    overflow: 'hidden',
    width: '100%',
  },
  continueGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  continueText: {
    color: '#ffffff',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
  },
  innerShadowLeft: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 4,
    width: 16,
  },
  innerShadowTop: {
    height: 16,
    left: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
