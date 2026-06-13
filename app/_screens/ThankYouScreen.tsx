import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenWrapper, useScreenBottomPadding } from '@/components/ScreenWrapper';
import { AppFonts } from '@/constants/theme';

const CHECK_ICON = require('@/assets/images/done.svg');
const LEAF_ICON = require('@/assets/images/leves.svg');

const summaryStats = [
  { id: 'stress-today', label: 'Stress Today', status: 'High' },
  { id: 'daily-ease', label: 'Daily Ease', value: '72', status: 'Supported', accent: true },
];

export function ThankYouScreen() {
  const bottomPadding = useScreenBottomPadding();

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
        }
        middleContent={
          <ScrollView
            bounces={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Image source={CHECK_ICON} style={styles.checkIcon} contentFit="contain" />
              <Text allowFontScaling={false} style={styles.heading}>
                Thanks Jhon!
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
                        7
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

            <View style={styles.bottomSpacer} />

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}>
              <LinearGradient
                colors={['#5AA1E2', '#0D6FD0']}
                end={{ x: 0, y: 1 }}
                locations={[0.0379, 0.75]}
                start={{ x: 0, y: 0 }}
                style={styles.doneGradient}>
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
                <Text style={styles.doneText}>Done</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        }
        middleContentStyle={styles.middleContent}
      />
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
  middleContent: {
    paddingHorizontal: 20,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
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
    gap: 4,
    marginBottom: 27,
  },
  statCard: {
    flex: 1,
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
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
    backgroundColor: '#2EB66814',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
  bottomSpacer: {
    flex: 1,
    minHeight: 31,
  },
  doneButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0d6fd0',
    borderRadius: 27,
    elevation: 0,
    height: 54,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  doneGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  doneText: {
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
