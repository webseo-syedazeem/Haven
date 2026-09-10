import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ChoiceRow } from '@/components/onboarding/OnboardingChoices';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { getModeLabel, type ModeId } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import {
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';
import { OnboardingContinueButtonBlack } from '@/components/onboarding/OnboardingcontinueButtonBlack';

const SITUATIONS: Record<ModeId, readonly string[]> = {
  sleep: [
    'My mind will not slow down',
    'I wake in the night',
    'Noise around me',
    'My schedule changes',
    'I struggle to get comfortable',
  ],
  relax: [
    'After a busy day',
    'When I feel overstimulated',
    'During a quiet break',
    'Before bed',
    'When I need some space',
  ],
  focus: [
    'Deep work',
    'Reading or studying',
    'Writing',
    'Noisy surroundings',
    'Creative work',
  ],
};

export default function SituationScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const options = useMemo(() => (mode ? SITUATIONS[mode] : []), [mode]);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const answers = await getOnboardingAnswers();
      if (!active) return;
      if (!answers.startingMode) {
        router.replace('/environment');
        return;
      }
      const modeOptions = SITUATIONS[answers.startingMode];
      setMode(answers.startingMode);
      setSelected(answers.situation.filter((item) => modeOptions.includes(item)));
      setHydrating(false);
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [router]);

  const toggleSituation = (situation: string) => {
    setSaveError(null);
    setSelected((current) =>
      current.includes(situation)
        ? current.filter((item) => item !== situation)
        : [...current, situation]
    );
  };

  const continueOnboarding = async () => {
    if (!mode || selected.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveOnboardingAnswers({ situation: selected });
      router.push('/onboarding/environments' as Href);
    } catch {
      setSaveError('We could not save that just yet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScaffold
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.footerContent}>
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          <OnboardingContinueButtonBlack
            disabled={hydrating || !mode || selected.length === 0}
            loading={saving}
            onPress={() => void continueOnboarding()}
          />
        </View>
      }
      onBack={() => router.back()}
  >
      {hydrating || !mode ? (
        <View style={styles.loading}>
          <ActivityIndicator color={HalcyonColors.accent} />
        </View>
      ) : (
        <>
          <View style={styles.headingGroup}>
           
            <Text style={styles.heading}>What usually gets in the way?</Text>
            <Text style={styles.description}>
              Select all that apply. We will shape your {getModeLabel(mode).toLowerCase()} picks
              around them.
            </Text>
          </View>
         <View style={styles.options}>
  {options.map((option) => (
    <ChoiceRow
      key={option}
      label={option}
      onPress={() => toggleSituation(option)}
      selected={selected.includes(option)}
    />
  ))}
</View>
        </>
      )}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
 options: {
  gap: 10,
},
  content: {
    paddingTop: 24,
  },
  description: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 350,
  },
  error: {
    color: '#D9A39B',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  eyebrow: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  footerContent: {
    gap: 8,
  },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 34,
    fontWeight: '500',
    lineHeight: 39,
    maxWidth: 330,
  },
  headingGroup: {
    marginBottom: 30,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
