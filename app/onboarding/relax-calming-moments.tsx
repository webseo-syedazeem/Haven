import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RelaxChoiceRow } from '@/components/onboarding/RelaxChoiceRow';
import { RelaxContinueButton } from '@/components/onboarding/RelaxContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { RelaxStepHeader } from '@/components/onboarding/RelaxStepHeader';
import { RELAX_ACCENT } from '@/constants/design';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import {
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';

const background = require('@/assets/images/relax-questions-bg.webp');

const OPTIONS = [
  'During the day',
  'In the evenings',
  'At night',
  'Throughout the day',
] as const;

type CalmingMomentOption = (typeof OPTIONS)[number];

function CalmingMomentIcon({
  option,
  selected,
}: {
  option: CalmingMomentOption;
  selected: boolean;
}) {
  const color = selected ? RELAX_ACCENT : '#FFFFFF';

  if (option === 'In the evenings') {
    return (
      <MaterialCommunityIcons
        color={color}
        name="sofa-outline"
        size={RELAX_ONBOARDING.optionRow.iconSize}
      />
    );
  }

  const iconName = {
    'During the day': 'sunny-outline',
    'At night': 'moon-outline',
    'Throughout the day': 'person-outline',
  }[option] as 'sunny-outline' | 'moon-outline' | 'person-outline';

  return <Ionicons color={color} name={iconName} size={RELAX_ONBOARDING.optionRow.iconSize} />;
}

export default function RelaxCalmingMomentsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<CalmingMomentOption | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;

    void getOnboardingAnswers()
      .then((answers) => {
        const saved = OPTIONS.find(
          (option) => option === answers.calming_moments
        );
        if (active && saved) setSelected(saved);
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
  }, []);

  const continueFlow = async () => {
    if (!selected || hydrating || saving) return;

    setSaving(true);
    setSaveError('');
    try {
      await saveOnboardingAnswers({ calming_moments: selected });
      router.push('/onboarding/relax-your-fit' as Href);
    } catch {
      setSaveError('We could not save that just yet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScaffold
      backgroundImage={background}
      contentContainerStyle={styles.content}
      header={<RelaxStepHeader currentStep={6} onBack={() => safeGoBack(router)} />}>
      <Text style={styles.heading}>
        When do you most{'\n'}need to feel calmer?
      </Text>

      <View style={styles.options}>
        {OPTIONS.map((option) => {
          const isSelected = selected === option;
          return (
            <RelaxChoiceRow
              icon={
                <CalmingMomentIcon option={option} selected={isSelected} />
              }
              key={option}
              label={option}
              onPress={() => {
                setSaveError('');
                setSelected(option);
              }}
              selected={isSelected}
            />
          );
        })}
      </View>

      <View style={styles.buttonArea}>
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
        <RelaxContinueButton
          disabled={hydrating || !selected}
          label="Next"
          loading={saving}
          onPress={() => void continueFlow()}
        />
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  buttonArea: {
    gap: 8,
    marginTop: 'auto',
    paddingTop: RELAX_ONBOARDING.button.contentGap,
    width: '100%',
  },
  content: {
    paddingBottom: RELAX_ONBOARDING.content.paddingBottom,
    paddingHorizontal: RELAX_ONBOARDING.screenPaddingHorizontal,
    paddingTop: RELAX_ONBOARDING.content.paddingTop,
  },
  error: {
    color: '#D9A39B',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: RELAX_ONBOARDING.longHeading.fontSize,
    fontWeight: '600',
    letterSpacing: RELAX_ONBOARDING.longHeading.letterSpacing,
    lineHeight: RELAX_ONBOARDING.longHeading.lineHeight,
  },
  options: {
    gap: RELAX_ONBOARDING.gaps.optionRows,
    marginTop: RELAX_ONBOARDING.gaps.headingToContent,
  },
});
