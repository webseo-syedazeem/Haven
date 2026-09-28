import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceRow } from '@/components/onboarding/OnboardingChoices';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { ONBOARDING_DURATION_OPTIONS } from '@/constants/filters';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import {
  completeOnboardingAnswers,
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';
import { OnboardingContinueButtonBlack } from '@/components/onboarding/OnboardingcontinueButtonBlack';

export default function SessionLengthScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    void getOnboardingAnswers().then((answers) => setSelected(answers.sessionLength));
  }, []);

  const continueFlow = async () => {
    if (!selected || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveOnboardingAnswers({ sessionLength: selected });
      await completeOnboardingAnswers();
      router.push('/onboarding/the-ritual' as Href);
    } catch {
      setSaveError('We could not save that choice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScaffold
      footer={
        <View style={styles.footerContent}>
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          <OnboardingContinueButtonBlack
            disabled={!selected}
            loading={saving}
            onPress={() => void continueFlow()}
          />
        </View>
      }
      onBack={() => safeGoBack(router)}>
      <Text style={styles.heading}>How long are your sessions?</Text>
      <Text style={styles.hint}>Choose your usual listening time.</Text>
      <View style={styles.list}>
        {ONBOARDING_DURATION_OPTIONS.map((option) => (
          <ChoiceRow
            icon={
              <Ionicons
                color={selected === option.value ? HalcyonColors.accent : HalcyonColors.textSecondary}
                name="time-outline"
                size={18}
              />
            }
            key={option.value}
            label={option.label}
            onPress={() => {
              setSaveError('');
              setSelected(option.value);
            }}
            selected={selected === option.value}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  error: {
    color: '#DFA196',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  footerContent: { gap: 8 },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 32,
    lineHeight: 37,
    marginTop: 14,
    maxWidth: 300,
  },
  hint: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  list: {
    gap: 9,
    marginTop: 24,
  },
});
