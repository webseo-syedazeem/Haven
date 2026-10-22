import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceRow } from '@/components/onboarding/OnboardingChoices';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { SOUNDS_TO_AVOID_VALUES } from '@/constants/filters';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import { getOnboardingAnswers, saveOnboardingAnswers } from '@/lib/onboarding';
import { OnboardingContinueButtonBlack } from '@/components/onboarding/OnboardingcontinueButtonBlack';

const OPTIONS = SOUNDS_TO_AVOID_VALUES;

export default function SoundsToAvoidScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const noneSelected = !hydrating && selected.length === 0;

  useEffect(() => {
    let active = true;
    void getOnboardingAnswers().then((answers) => {
      if (!active) return;
      setSelected(answers.excludedSounds);
      setHydrating(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggle = (value: string) => {
    setSaveError('');
    setSelected((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const chooseNone = () => {
    setSaveError('');
    setSelected([]);
  };

  const continueFlow = async () => {
    if (hydrating || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveOnboardingAnswers({ excludedSounds: selected });
      router.push('/onboarding/detail-preference' as Href);
    } catch {
      setSaveError('We could not save those choices. Please try again.');
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
            disabled={hydrating}
            loading={saving}
            onPress={() => void continueFlow()}
          />
        </View>
      }
      onBack={() => safeGoBack(router)}
     >
      <Text style={styles.heading}>Anything to leave out?</Text>
      <Text style={styles.hint}>
        We will hide soundscapes that contain any of these.
      </Text>
      <View style={styles.list}>
        {OPTIONS.map((value) => (
          <ChoiceRow
            icon={
              <Ionicons
                color={selected.includes(value) ? HalcyonColors.accent : HalcyonColors.textSecondary}
                name="volume-mute-outline"
                size={18}
              />
            }
            key={value}
            label={value}
            onPress={() => toggle(value)}
            selected={selected.includes(value)}
          />
        ))}
        <ChoiceRow
          icon={
            <Ionicons
              color={noneSelected ? HalcyonColors.accent : HalcyonColors.textSecondary}
              name="checkmark-circle-outline"
              size={18}
            />
          }
          label="None"
          onPress={chooseNone}
          selected={noneSelected}
        />
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
    lineHeight: 36,
    marginTop: 14,
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
    marginTop: 22,
  },
});
