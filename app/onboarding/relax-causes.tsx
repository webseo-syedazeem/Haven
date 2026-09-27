import { Ionicons } from '@expo/vector-icons';
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
import {
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';

const background = require('@/assets/images/relax-questions-bg.webp');

const OPTIONS = [
  'Work',
  'Overthinking',
  'Social situations',
  'News and social media',
  'Finances',
  'Other',
] as const;

type CauseOption = (typeof OPTIONS)[number];

const ICONS = {
  Work: 'briefcase-outline',
  Overthinking: 'person-outline',
  'Social situations': 'people-outline',
  'News and social media': 'phone-portrait-outline',
  Finances: 'wallet-outline',
  Other: 'ellipsis-horizontal',
} as const;

function CauseIcon({
  option,
  selected,
}: {
  option: CauseOption;
  selected: boolean;
}) {
  return (
    <Ionicons
      color={selected ? RELAX_ACCENT : '#FFFFFF'}
      name={ICONS[option]}
      size={RELAX_ONBOARDING.optionRow.iconSize}
    />
  );
}

export default function RelaxCausesScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<CauseOption[]>([]);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;

    void getOnboardingAnswers()
      .then((answers) => {
        if (!active) return;
        const saved = OPTIONS.filter((option) =>
          answers.relax_causes.includes(option)
        );
        setSelected(saved);
      })
      .catch(() => {
        if (active) setSaveError('We could not load your saved choices.');
      })
      .finally(() => {
        if (active) setHydrating(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const toggle = (option: CauseOption) => {
    setSaveError('');
    setSelected((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
    );
  };

  const continueFlow = async () => {
    if (hydrating || selected.length === 0 || saving) return;

    setSaving(true);
    setSaveError('');
    try {
      await saveOnboardingAnswers({ relax_causes: selected });
      router.push('/onboarding/relax-calming-moments' as Href);
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
      header={<RelaxStepHeader currentStep={5} onBack={() => router.back()} />}>
      <Text style={styles.heading}>
        What&apos;s usually{'\n'}causes you stress?
      </Text>
      <Text style={styles.subtitle}>Select all that apply.</Text>

      <View style={styles.options}>
        {OPTIONS.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <RelaxChoiceRow
              icon={<CauseIcon option={option} selected={isSelected} />}
              key={option}
              label={option}
              onPress={() => toggle(option)}
              selected={isSelected}
            />
          );
        })}
      </View>

      <View style={styles.buttonArea}>
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
        <RelaxContinueButton
          disabled={hydrating || selected.length === 0}
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
    fontSize: RELAX_ONBOARDING.heading.fontSize,
    fontWeight: '600',
    letterSpacing: RELAX_ONBOARDING.heading.letterSpacing,
    lineHeight: RELAX_ONBOARDING.heading.lineHeight,
  },
  options: {
    gap: RELAX_ONBOARDING.gaps.optionRows,
    marginTop: RELAX_ONBOARDING.gaps.bodyToContent,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: AppFonts.sansRegular,
    fontSize: RELAX_ONBOARDING.body.fontSize,
    lineHeight: RELAX_ONBOARDING.body.lineHeight,
    marginTop: RELAX_ONBOARDING.gaps.headingToBody,
  },
});
