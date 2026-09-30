import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';

import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import type { ModeId } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import { getOnboardingAnswers } from '@/lib/onboarding';

const brandIcon = require('@/assets/images/passage-brand-assets/screens-icon.webp');
const focusScienceBackground = require('@/assets/images/science-focus-mountain-lake-blurred.webp');
const sleepScienceBackground = require('@/assets/images/science-mountain-lake-blurred.webp');

export default function BackedByScienceScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId>('focus');

  useEffect(() => {
    let active = true;
    void getOnboardingAnswers().then((answers) => {
      if (!active) return;
      if (answers.startingMode) {
        setMode(answers.startingMode);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const isSleep = mode === 'sleep';
  const spikeColor = isSleep ? '#9FAEFD' : '#F4B34C';

  const handleContinue = () => {
    router.push('/onboarding/the-ritual' as Href);
  };

  return (
    <View style={styles.screen}>
      <ImageBackground
        resizeMode="cover"
        source={isSleep ? sleepScienceBackground : focusScienceBackground}
        style={styles.backgroundImage}>
        <LinearGradient
          colors={[
            'rgba(10, 11, 15, 0.45)',
            'rgba(10, 11, 15, 0.15)',
            'rgba(10, 11, 15, 0.65)',
            '#0A0B0D',
          ]}
          locations={[0, 0.25, 0.72, 1]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          {/* Header with back button and centered brand */}
          <View style={styles.header}>
            {/* Absolute centered Brand - locked to horizontal center */}
            <View pointerEvents="none" style={styles.brandCenterAbsolute}>
              <Image source={brandIcon} style={styles.brandIcon} />
              <Text style={styles.brandText}>Passage</Text>
            </View>

            <OnboardingBackButton
              onPress={() => safeGoBack(router)}
              style={styles.backButtonLayer}
            />

            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.contentCenter}>
              <View style={styles.titleContainer}>
                <Text adjustsFontSizeToFit numberOfLines={1} style={styles.title}>
                  Why sound can help.
                </Text>
              </View>

              {/* Waveform Comparison Graphic */}
              <View style={styles.waveformContainer}>
                <Svg height="110" viewBox="0 0 330 110" width="100%">
                  <Defs>
                    <SvgLinearGradient id="waveGrad" x1="0" x2="1" y1="0" y2="0">
                      <Stop offset="0%" stopColor={spikeColor} />
                      <Stop offset="46%" stopColor={spikeColor} />
                      <Stop offset="54%" stopColor="#EDE6DD" />
                      <Stop offset="100%" stopColor="#EDE6DD" />
                    </SvgLinearGradient>
                  </Defs>
                  {/* Glow layer */}
                  <Path
                    d="M 6 55 L 18 55 L 26 42 L 32 68 L 38 24 L 45 86 L 52 10 L 60 98 L 68 18 L 76 90 L 84 28 L 92 80 L 100 36 L 108 72 L 116 42 L 124 66 L 132 47 L 140 61 L 148 55 C 160 32, 175 32, 187 55 C 199 78, 214 78, 226 55 C 238 32, 253 32, 265 55 C 277 78, 292 78, 304 55 L 324 55"
                    fill="none"
                    opacity={0.35}
                    stroke={spikeColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={7}
                  />
                  {/* Main sharp stroke */}
                  <Path
                    d="M 6 55 L 18 55 L 26 42 L 32 68 L 38 24 L 45 86 L 52 10 L 60 98 L 68 18 L 76 90 L 84 28 L 92 80 L 100 36 L 108 72 L 116 42 L 124 66 L 132 47 L 140 61 L 148 55 C 160 32, 175 32, 187 55 C 199 78, 214 78, 226 55 C 238 32, 253 32, 265 55 C 277 78, 292 78, 304 55 L 324 55"
                    fill="none"
                    stroke="url(#waveGrad)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.8}
                  />
                </Svg>

                {/* Labels under waveform */}
                <View style={styles.labelsRow}>
                  <View style={styles.labelCol}>
                    <Text style={[styles.disruptionsTitle, { color: spikeColor }]}>
                      {isSleep ? 'Sudden sound' : 'Disruptions'}
                    </Text>
                    <Text style={styles.labelDesc}>
                      {isSleep
                        ? 'The sleeping brain\nnotices change.'
                        : 'Attention reacts to\nsudden change.'}
                    </Text>
                  </View>

                  <View style={styles.labelCol}>
                    <Text style={styles.steadierTitle}>A steadier sound</Text>
                    <Text style={styles.labelDesc}>
                      {isSleep
                        ? 'Steady sound can\nsoften the contrast.'
                        : 'Layered sound can\nsoften that contrast.'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <OnboardingContinueButton
              label="SEE HOW PASSAGE WORKS"
              onPress={handleContinue}
              showArrow
              variant={isSleep ? 'lavender' : 'amber'}
            />
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  backButtonLayer: {
    zIndex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  brandCenterAbsolute: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  },
  brandIcon: {
    height: 38,
    resizeMode: 'contain',
    width: 58,
  },
  brandText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginLeft: -9,
  },
  contentCenter: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
    width: '100%',
  },
  disruptionsTitle: {
    color: '#F4B34C',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 38,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 14,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'relative',
    width: '100%',
  },
  headerSpacer: {
    height: 40,
    width: 40,
    zIndex: 1,
  },
  labelCol: {
    alignItems: 'center',
    flex: 1,
  },
  labelDesc: {
    color: '#D4CFCA',
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 34,
    paddingHorizontal: 4,
    width: '100%',
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    backgroundColor: '#0A0B0D',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
    paddingHorizontal: 22,
  },
  steadierTitle: {
    color: '#EDE6DD',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 38,
    textAlign: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 42,
    letterSpacing: -0.5,
    lineHeight: 48,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 52,
    width: '100%',
  },
  waveformContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    maxWidth: 380,
    width: '100%',
  },
});
