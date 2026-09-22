import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingPillButton } from '@/components/onboarding/OnboardingPillButton';
import { OnboardingStepHeader } from '@/components/onboarding/OnboardingStepHeader';
import { AppFonts } from '@/constants/theme';

const heroImage = require('@/assets/images/preview-tokyo-rain.jpg');

const FEATURES = [
  'Specific places, not generic loops',
  'Layered sound you can shape',
  'Sessions built around an intention',
];

export default function WhyPassageScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Header with Step 2 Active */}
      <OnboardingStepHeader
        currentStep={2}
        onBack={() => router.back()}
        showBack
        totalSteps={4}
      />

      <View style={styles.content}>
        {/* Heading */}
        <View style={styles.headerBlock}>
          <Text style={styles.heading}>
            More than{'\n'}background noise.
          </Text>
        </View>

        {/* Hero Visual Card */}
        <View style={styles.imageCardWrapper}>
          <Image resizeMode="cover" source={heroImage} style={styles.heroImage} />
        </View>

        {/* 3 Horizontal Separator Feature Items */}
        <View style={styles.featuresList}>
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
      </View>

      {/* Footer Continue Button */}
      <View style={styles.footer}>
        <OnboardingPillButton
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
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
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
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  featureText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  featuresList: {
    marginVertical: 12,
    width: '100%',
  },
  footer: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    width: '100%',
  },
  headerBlock: {
    alignItems: 'center',
    paddingTop: 8,
    width: '100%',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 38,
    letterSpacing: -0.5,
    lineHeight: 44,
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
    height: 195,
    marginVertical: 14,
    overflow: 'hidden',
    width: '100%',
  },
  safeArea: {
    backgroundColor: '#0B0B0D',
    flex: 1,
  },
});
