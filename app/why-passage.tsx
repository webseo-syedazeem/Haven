import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingPillButton } from '@/components/onboarding/OnboardingPillButton';
import { OnboardingStepHeader } from '@/components/onboarding/OnboardingStepHeader';
import { AppFonts } from '@/constants/theme';
import { isGuestModeActive, setGuestModeActive } from '@/lib/auth/session-state';
import { safeGoBack } from '@/lib/navigation';

const heroImage = require('@/assets/images/why-passage-field-recording-v2.webp');

const FEATURES = [
  'Immersive binaural sounds',
  'High-quality audio, carefully crafted',
  'Designed for focus, sleep and relaxation',
];

const CONTENT_TOP_PADDING = 8;
const FEATURE_LIST_VERTICAL_MARGIN = 12;
const HERO_MAX_HEIGHT = 270;
const HERO_MIN_HEIGHT = 120;
const HERO_VERTICAL_MARGIN = 14;
const LAYOUT_ROUNDING_BUFFER = 2;

export default function WhyPassageScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const enteredViaAuthenticatedResume = from === 'authenticated-resume';
  const [viewportHeight, setViewportHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [featuresHeight, setFeaturesHeight] = useState(0);

  const measuredHeroHeight =
    viewportHeight > 0 && headerHeight > 0 && featuresHeight > 0
      ? viewportHeight -
        CONTENT_TOP_PADDING -
        headerHeight -
        featuresHeight -
        FEATURE_LIST_VERTICAL_MARGIN * 2 -
        HERO_VERTICAL_MARGIN * 2 -
        LAYOUT_ROUNDING_BUFFER
      : HERO_MAX_HEIGHT;
  const heroHeight = Math.min(
    HERO_MAX_HEIGHT,
    Math.max(HERO_MIN_HEIGHT, measuredHeroHeight)
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Header with Step 2 Active */}
      <OnboardingStepHeader
        activeColor="#FFFFFF"
        currentStep={2}
        onBack={enteredViaAuthenticatedResume ? undefined : async () => {
          if (isGuestModeActive()) await setGuestModeActive(false);
          safeGoBack(router);
        }}
        showBack={!enteredViaAuthenticatedResume}
        totalSteps={4}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}>
        {/* Heading */}
        <View
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          style={styles.headerBlock}>
          <Text style={styles.heading}>
            Passage is the ultimate{'\n'}soundscape app.
          </Text>
        </View>

        {/* Hero Visual Card */}
        <View style={[styles.imageCardWrapper, { height: heroHeight }]}>
          <Image resizeMode="cover" source={heroImage} style={styles.heroImage} />
        </View>

        {/* 3 Horizontal Separator Feature Items */}
        <View
          onLayout={(event) => setFeaturesHeight(event.nativeEvent.layout.height)}
          style={styles.featuresList}>
          {FEATURES.map((item, index) => (
            <View
              key={item}
              style={[
                styles.featureRow,
                index === 0 && styles.featureRowFirst,
              ]}
            >
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer Continue Button */}
      <View style={styles.footer}>
        <OnboardingPillButton
          arrowAtEnd
          label="CONTINUE"
          onPress={() => router.push('/what-it-does' as any)}
          variant="white"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: CONTENT_TOP_PADDING,
  },
  featureRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    paddingVertical: 18,
  },
  featureRowFirst: {
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  featureText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    letterSpacing: 0.1,
    lineHeight: 22,
    textAlign: 'center',
  },
  featuresList: {
    marginBottom: FEATURE_LIST_VERTICAL_MARGIN * 2,
    marginTop: 0,
    width: '100%',
  },
  footer: {
    paddingBottom: 14,
    paddingHorizontal: 24,
    paddingTop: 12,
    width: '100%',
  },
  headerBlock: {
    alignItems: 'center',
    paddingTop: 0,
    width: '100%',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.displayRegular,
    fontSize: 42,
    letterSpacing: -0.5,
    lineHeight: 48,
    textAlign: 'center',
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  imageCardWrapper: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: HERO_VERTICAL_MARGIN,
    overflow: 'hidden',
    width: '100%',
  },
  safeArea: {
    backgroundColor: '#0B0B0D',
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
});
