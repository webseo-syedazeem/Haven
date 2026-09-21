import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { AppFonts } from '@/constants/theme';
import {
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';

const brandIcon = require('@/assets/images/passage-brand-assets/screens-icon.webp');

const CONTEXTS = [
  {
    id: 'desk',
    label: 'At a desk',
    image: require('@/assets/images/personalise-desk.jpg'),
  },
  {
    id: 'studying',
    label: 'Studying',
    image: require('@/assets/images/personalise-study.jpg'),
  },
  {
    id: 'creative',
    label: 'Creative work',
    image: require('@/assets/images/personalise-creative.jpg'),
  },
  {
    id: 'move',
    label: 'On the move',
    image: require('@/assets/images/personalise-move.jpg'),
  },
] as const;

const DURATIONS = ['25 min', '45 min', '90+ min'] as const;

export default function PersonaliseScreen() {
  const router = useRouter();
  const [selectedContext, setSelectedContext] = useState<string>('desk');
  const [selectedDuration, setSelectedDuration] = useState<string>('45 min');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const answers = await getOnboardingAnswers();
      if (!active) return;
      if (answers.environments && answers.environments.length > 0) {
        setSelectedContext(answers.environments[0]);
      }
      if (answers.sessionLength) {
        setSelectedDuration(answers.sessionLength);
      }
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const handleContinue = async () => {
    if (!selectedContext || !selectedDuration || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveOnboardingAnswers({
        environments: [selectedContext],
        preferredSounds: [selectedContext],
        sessionLength: selectedDuration,
      });
      router.push('/backed-by-science' as Href);
    } catch {
      setSaveError('We could not save that just yet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
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
            <Text style={styles.title}>Where do you{'\n'}need it most?</Text>
            <Text style={styles.subtitle}>
              Choose your main context, then how long you usually focus for.
            </Text>
          </View>

          {/* 2x2 Grid */}
          <View style={styles.grid}>
            {CONTEXTS.map((item) => {
              const isSelected = selectedContext === item.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={item.id}
                  onPress={() => setSelectedContext(item.id)}
                  style={({ pressed }) => [
                    styles.card,
                    isSelected ? styles.cardSelected : styles.cardUnselected,
                    pressed && styles.pressedCard,
                  ]}>
                  <ImageBackground
                    resizeMode="cover"
                    source={item.image}
                    style={StyleSheet.absoluteFill}>
                    <LinearGradient
                      colors={['transparent', 'rgba(10, 11, 13, 0.45)', 'rgba(10, 11, 13, 0.88)']}
                      locations={[0.3, 0.65, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                  </ImageBackground>

                  {/* Circular check indicator top right */}
                  <View
                    style={[
                      styles.cardCheck,
                      isSelected ? styles.cardCheckSelected : styles.cardCheckUnselected,
                    ]}>
                    {isSelected ? (
                      <Ionicons color="#0B0B0D" name="checkmark" size={14} />
                    ) : null}
                  </View>

                  {/* Label bottom left */}
                  <Text style={styles.cardLabel}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Divider with centered label */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOW LONG DO YOU USUALLY FOCUS?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Duration Pills */}
          <View style={styles.durationRow}>
            {DURATIONS.map((dur) => {
              const isSelected = selectedDuration === dur;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={dur}
                  onPress={() => setSelectedDuration(dur)}
                  style={({ pressed }) => [
                    styles.durationPill,
                    isSelected ? styles.durationPillSelected : styles.durationPillUnselected,
                    pressed && styles.pressedPill,
                  ]}>
                  <Text
                    style={[
                      styles.durationText,
                      isSelected ? styles.durationTextSelected : styles.durationTextUnselected,
                    ]}>
                    {dur}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
          <OnboardingContinueButton
            disabled={!selectedContext || !selectedDuration}
            label="CONTINUE"
            loading={saving}
            onPress={() => void handleContinue()}
            showArrow
          />
        </View>
      </SafeAreaView>
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
  card: {
    borderRadius: 14,
    height: 136,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: 12,
    width: '48%',
  },
  cardCheck: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  cardCheckSelected: {
    backgroundColor: '#F4B34C',
  },
  cardCheckUnselected: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1.5,
  },
  cardLabel: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  cardSelected: {
    borderColor: '#F4B34C',
    borderWidth: 1.5,
  },
  cardUnselected: {
    borderColor: '#26282E',
    borderWidth: 1,
  },
  dividerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 20,
  },
  dividerLine: {
    backgroundColor: '#26282E',
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: '#7E7A74',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    paddingHorizontal: 10,
  },
  durationPill: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  durationPillSelected: {
    backgroundColor: '#F4B34C',
  },
  durationPillUnselected: {
    backgroundColor: '#141518',
    borderColor: '#26282E',
    borderWidth: 1,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationText: {
    fontSize: 14,
  },
  durationTextSelected: {
    color: '#0B0B0D',
    fontFamily: AppFonts.sansBold,
    fontWeight: '700',
  },
  durationTextUnselected: {
    color: '#EDE6DD',
    fontFamily: AppFonts.sansMedium,
  },
  errorText: {
    color: '#D9A39B',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 14,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 20,
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
  pressed: {
    opacity: 0.7,
  },
  pressedCard: {
    opacity: 0.88,
  },
  pressedPill: {
    opacity: 0.8,
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    backgroundColor: '#0A0B0D',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  subtitle: {
    color: '#9E9A92',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 34,
    letterSpacing: -0.3,
    lineHeight: 40,
  },
  titleContainer: {
    marginTop: 4,
  },
});
