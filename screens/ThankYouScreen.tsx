import { Image } from 'expo-image';
import {
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingContinueButton } from '../components/onboarding/OnboardingContinueButton';

const CHECK_ICON = require('@/assets/images/done.svg');
const LEAF_ICON = require('@/assets/images/leves.svg');
const SF_PRO_FONT = Platform.select({
  ios: 'SF Pro',
  web: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  default: 'sans-serif',
});

const summaryStats = [
  { id: 'stress-today', label: 'Stress Today', status: 'High' },
  { id: 'daily-ease', label: 'Daily Ease', value: '72', status: 'Supported', accent: true },
];

export function ThankYouScreen() {
  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require('@/assets/images/thankyou_page.png')}
        resizeMode="cover"
        style={styles.background}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.topSpacer} />

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

            <OnboardingContinueButton label="Done" />
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
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
  background: {
    flex: 1,
    width: '100%',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  topSpacer: {
    flex: 1,
    minHeight: 96,
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
    fontFamily: 'Playfair Display',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#173F5F',
    marginBottom: 4,
  },
  subtitle: {
    maxWidth: 270,
    fontFamily: SF_PRO_FONT,
    fontWeight: '510' as TextStyle['fontWeight'],
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    color: '#54555A',
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
    fontFamily: SF_PRO_FONT,
    fontWeight: '400',
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
    fontFamily: SF_PRO_FONT,
    fontWeight: '700',
    fontSize: 30,
    lineHeight: 34,
    textAlign: 'center',
    color: '#000000',
  },
  statValueSmall: {
    fontFamily: SF_PRO_FONT,
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 24,
    color: '#000000',
  },
  statStatus: {
    fontFamily: SF_PRO_FONT,
    fontWeight: '400',
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
    fontFamily: SF_PRO_FONT,
    fontWeight: '510' as TextStyle['fontWeight'],
    fontSize: 14,
    lineHeight: 20,
    color: '#54555A',
  },
  supportGreenText: {
    fontFamily: SF_PRO_FONT,
    fontWeight: '510' as TextStyle['fontWeight'],
    fontSize: 14,
    lineHeight: 22,
    color: '#2EB668',
    marginTop: 2,
  },
  bottomSpacer: {
    flex: 1,
    minHeight: 31,
  },
});
