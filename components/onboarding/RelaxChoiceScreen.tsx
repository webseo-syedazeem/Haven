import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChoiceRow } from '@/components/onboarding/OnboardingChoices';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { RelaxStepHeader } from '@/components/onboarding/RelaxStepHeader';
import {
  PassageColors,
  RELAX_ACCENT,
  RELAX_ACCENT_PRESSED,
} from '@/constants/design';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import {
  completeOnboardingAnswers,
  getOnboardingAnswers,
  saveOnboardingAnswers,
  type GuestOnboardingAnswersPatch,
} from '@/lib/onboarding';

const questionsBackground = require('@/assets/images/relax-questions-bg.webp');

type RelaxAnswerKey = 'mainGoal' | 'relaxCauses' | 'calmingMoments';

type RelaxChoiceScreenProps = {
  answerKey: RelaxAnswerKey;
  completeOnContinue?: boolean;
  eyebrow: string;
  multiple?: boolean;
  nextRoute: Href;
  options: readonly string[];
  step: number;
  subtitle?: string;
  title: string;
};

function answerValues(
  answerKey: RelaxAnswerKey,
  answers: Awaited<ReturnType<typeof getOnboardingAnswers>>
): string[] {
  if (answerKey === 'relaxCauses') return answers.relaxCauses;
  const value =
    answerKey === 'mainGoal' ? answers.mainGoal : answers.calmingMoments;
  return value ? [value] : [];
}

function answerPatch(
  answerKey: RelaxAnswerKey,
  values: string[]
): GuestOnboardingAnswersPatch {
  if (answerKey === 'relaxCauses') return { relaxCauses: values };
  if (answerKey === 'mainGoal') return { mainGoal: values[0] ?? null };
  return { calmingMoments: values[0] ?? null };
}

export function RelaxChoiceScreen({
  answerKey,
  completeOnContinue = false,
  eyebrow,
  multiple = false,
  nextRoute,
  options,
  step,
  subtitle,
  title,
}: RelaxChoiceScreenProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;
    void getOnboardingAnswers()
      .then((answers) => {
        if (active) setSelected(answerValues(answerKey, answers));
      })
      .catch(() => {
        if (active) setSaveError('We could not load your saved choice.');
      })
      .finally(() => {
        if (active) setHydrating(false);
      });
    return () => {
      active = false;
    };
  }, [answerKey]);

  const choose = (option: string) => {
    setSaveError('');
    if (!multiple) {
      setSelected([option]);
      return;
    }
    setSelected((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
    );
  };

  const continueFlow = async () => {
    if (hydrating || saving || selected.length === 0) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveOnboardingAnswers(answerPatch(answerKey, selected));
      if (completeOnContinue) await completeOnboardingAnswers();
      router.push(nextRoute);
    } catch {
      setSaveError('We could not save that just yet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScaffold
      backgroundImage={questionsBackground}
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.footer}>
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          <OnboardingContinueButton
            accentColor={RELAX_ACCENT}
            accentPressedColor={RELAX_ACCENT_PRESSED}
            disabled={hydrating || selected.length === 0}
            label="Continue"
            loading={saving}
            onPress={() => void continueFlow()}
            showArrow
          />
        </View>
      }
      header={
        <RelaxStepHeader currentStep={step} onBack={() => safeGoBack(router)} />
      }>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.heading}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.options}>
        {options.map((option) => (
          <ChoiceRow
            accentColor={RELAX_ACCENT}
            key={option}
            label={option}
            onPress={() => choose(option)}
            selected={selected.includes(option)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 22,
    paddingTop: 20,
  },
  error: {
    color: '#D9A39B',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  eyebrow: {
    color: RELAX_ACCENT,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  footer: {
    gap: 8,
  },
  heading: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: RELAX_ONBOARDING.heading.fontSize,
    fontWeight: '500',
    letterSpacing: -0.35,
    lineHeight: RELAX_ONBOARDING.heading.lineHeight,
    marginTop: 10,
    maxWidth: 340,
  },
  options: {
    gap: 10,
    marginTop: 24,
  },
  subtitle: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: RELAX_ONBOARDING.body.fontSize,
    lineHeight: RELAX_ONBOARDING.body.lineHeight,
    marginTop: 9,
  },
});
