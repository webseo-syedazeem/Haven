import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceRow } from '@/components/onboarding/OnboardingChoices';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import {
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';
import { OnboardingContinueButtonBlack } from '@/components/onboarding/OnboardingcontinueButtonBlack';

const GOALS = [
  'Fall asleep faster',
  'Stay asleep',
  'Unwind after work',
  'Focus and do deep work',
  'Reduce a racing mind',
  'Feel calmer',
] as const;

type Goal = (typeof GOALS)[number];

const MIN_GOALS = 1;
const MAX_GOALS = 5;

function isGoal(value: string): value is Goal {
  return (GOALS as readonly string[]).includes(value);
}

export default function GoalsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Goal[]>([]);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const answers = await getOnboardingAnswers();
      if (!active) return;
      setSelected(answers.goals.filter(isGoal).slice(0, MAX_GOALS));
      setHydrating(false);
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const toggleGoal = (goal: Goal) => {
    setSaveError(null);
    setSelected((current) => {
      if (current.includes(goal)) return current.filter((item) => item !== goal);
      if (current.length >= MAX_GOALS) return current;
      return [...current, goal];
    });
  };

  const continueOnboarding = async () => {
    if (selected.length < MIN_GOALS || selected.length > MAX_GOALS) return;

    setSaving(true);
    setSaveError(null);
    try {
      await saveOnboardingAnswers({ goals: selected });
      router.push('/onboarding/situation');
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
            disabled={hydrating || selected.length < MIN_GOALS}
            loading={saving}
            onPress={() => void continueOnboarding()}
          />
        </View>
      }
      onBack={() => router.back()}
     >
      <View style={styles.headingGroup}>
       
        <Text style={styles.heading}>What would you like Passage to help with?</Text>
        <Text style={styles.description}>
          Choose between one and five. You can change these later.
        </Text>
      </View>

      <View style={styles.options}>
        {GOALS.map((goal) => (
          <ChoiceRow
            key={goal}
            label={goal}
            onPress={() => toggleGoal(goal)}
            selected={selected.includes(goal)}
          />
        ))}
      </View>
      {selected.length === MAX_GOALS ? (
        <Text accessibilityLiveRegion={'polite'} style={styles.limitMessage}>
          You have selected the maximum of five goals.
        </Text>
      ) : null}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
  },
  description: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
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
    fontSize: 32,
    fontWeight: '500',
    lineHeight: 36,
    maxWidth: 350,
  },
  headingGroup: {
    marginBottom: 24,
  },
  limitMessage: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  options: {
    gap: 10,
  },
});
