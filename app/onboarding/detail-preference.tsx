import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceRow } from '@/components/onboarding/OnboardingChoices';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { PassageColors } from '@/constants/design';
import { DETAIL_LEVEL_LABELS, DETAIL_LEVEL_VALUES } from '@/constants/filters';
import { AppFonts } from '@/constants/theme';
import type { DetailPreference } from '@/lib/api/preferences';
import { safeGoBack } from '@/lib/navigation';
import { getOnboardingAnswers, saveOnboardingAnswers } from '@/lib/onboarding';
import { OnboardingContinueButtonBlack } from '@/components/onboarding/OnboardingcontinueButtonBlack';

const COPY: Record<DetailPreference, string> = {
  minimal: 'Simple, clear soundscapes with less variation.',
  balanced: 'A gentle mix of detail and calm.',
  rich: 'Layered and immersive with more texture.',
};
const ICONS = {
  minimal: 'remove-outline',
  balanced: 'options-outline',
  rich: 'layers-outline',
} as const;

export default function DetailPreferenceScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<DetailPreference | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    void getOnboardingAnswers().then((answers) =>
      setSelected(answers.detailPreference)
    );
  }, []);

  const continueFlow = async () => {
    if (!selected || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveOnboardingAnswers({ detailPreference: selected });
      router.push('/onboarding/session-length' as Href);
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
      onBack={() => safeGoBack(router)}
      >
      <Text style={styles.heading}>How much detail do you like?</Text>
      <Text style={styles.hint}>Choose the texture that feels most comfortable.</Text>
      <View style={styles.list}>
        {DETAIL_LEVEL_VALUES.map((value) => (
          <ChoiceRow
            description={COPY[value]}
            icon={
              <Ionicons
                color={selected === value ? PassageColors.accent : PassageColors.textSecondary}
                name={ICONS[value]}
                size={19}
              />
            }
            key={value}
            label={DETAIL_LEVEL_LABELS[value]}
            onPress={() => {
              setSaveError('');
              setSelected(value);
            }}
            selected={selected === value}
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
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 32,
    lineHeight: 37,
    marginTop: 14,
    maxWidth: 300,
  },
  hint: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  list: {
    gap: 12,
    marginTop: 26,
  },
});
