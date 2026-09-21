import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { AppFonts } from '@/constants/theme';

const brandIcon = require('@/assets/images/passage-brand-assets/screens-icon.webp');
const duskMountains = require('@/assets/images/science-dusk.jpg');

export default function BackedByScienceScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/onboarding/the-ritual' as Href);
  };

  return (
    <View style={styles.screen}>
      <ImageBackground
        resizeMode="cover"
        source={duskMountains}
        style={styles.backgroundImage}>
        <LinearGradient
          colors={[
            'rgba(10, 11, 13, 0.25)',
            'rgba(10, 11, 13, 0.7)',
            '#0A0B0D',
            '#0A0B0D',
          ]}
          locations={[0, 0.38, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          {/* Header with back button and centered brand */}
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Ionicons color="#FFFFFF" name="chevron-back" size={22} />
            </Pressable>

            <View style={styles.brandCenter}>
              <Image source={brandIcon} style={styles.brandIcon} />
              <Text style={styles.brandText}>Passage</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Why sound can help.</Text>
            </View>

            {/* Waveform Comparison Graphic */}
            <View style={styles.waveformContainer}>
              <Svg height="110" viewBox="0 0 330 110" width="100%">
                <Defs>
                  <SvgLinearGradient id="waveGrad" x1="0" x2="1" y1="0" y2="0">
                    <Stop offset="0%" stopColor="#F4B34C" />
                    <Stop offset="46%" stopColor="#F4B34C" />
                    <Stop offset="54%" stopColor="#EDE6DD" />
                    <Stop offset="100%" stopColor="#EDE6DD" />
                  </SvgLinearGradient>
                </Defs>
                <Path
                  d="M 6 55 L 18 55 L 26 42 L 32 68 L 38 24 L 45 86 L 52 10 L 60 98 L 68 18 L 76 90 L 84 28 L 92 80 L 100 36 L 108 72 L 116 42 L 124 66 L 132 47 L 140 61 L 148 55 C 160 32, 175 32, 187 55 C 199 78, 214 78, 226 55 C 238 32, 253 32, 265 55 C 277 78, 292 78, 304 55 L 324 55"
                  fill="none"
                  stroke="url(#waveGrad)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.4}
                />
              </Svg>

              {/* Labels under waveform */}
              <View style={styles.labelsRow}>
                <View style={styles.labelCol}>
                  <Text style={styles.disruptionsTitle}>Disruptions</Text>
                  <Text style={styles.labelDesc}>Attention reacts to{'\n'}sudden change.</Text>
                </View>

                <View style={styles.labelCol}>
                  <Text style={styles.steadierTitle}>A steadier sound field</Text>
                  <Text style={styles.labelDesc}>Layered sound can{'\n'}soften that contrast.</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <OnboardingContinueButton
              label="SEE HOW PASSAGE WORKS"
              onPress={handleContinue}
              showArrow
            />
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backgroundImage: {
    flex: 1,
  },
  brandCenter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  brandIcon: {
    height: 22,
    resizeMode: 'contain',
    width: 32,
  },
  brandText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  disruptionsTitle: {
    color: '#F4B34C',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
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
  },
  headerSpacer: {
    height: 40,
    width: 40,
  },
  labelCol: {
    alignItems: 'center',
    flex: 1,
  },
  labelDesc: {
    color: '#9E9A92',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 6,
  },
  pressed: {
    opacity: 0.7,
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
    justifyContent: 'center',
    paddingBottom: 30,
    paddingHorizontal: 22,
  },
  steadierTitle: {
    color: '#EDE6DD',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 34,
    letterSpacing: -0.3,
    lineHeight: 40,
  },
  titleContainer: {
    marginBottom: 40,
  },
  waveformContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    width: '100%',
  },
});
