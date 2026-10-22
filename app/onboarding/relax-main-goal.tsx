import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
  'Feel less anxious',
  'Manage daily stress',
  'Be more present',
  'Sleep more easily',
] as const;

type GoalOption = (typeof OPTIONS)[number];

function LotusIcon({ color }: { color: string }) {
  return (
    <Svg
      height={RELAX_ONBOARDING.optionRow.iconSize}
      viewBox="0 0 48 48"
      width={RELAX_ONBOARDING.optionRow.iconSize}>
      <Path
        d="M24 7c-6.3 6-9 11.5-9 17.2 0 6.1 3.5 10.2 9 13.8 5.5-3.6 9-7.7 9-13.8C33 18.5 30.3 13 24 7Z"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M15.5 16.5c-5.7 1.5-9.4 4-11.5 7.2 3 5.5 7.9 8.7 14.5 9.1M32.5 16.5c5.7 1.5 9.4 4 11.5 7.2-3 5.5-7.9 8.7-14.5 9.1M12.5 31.5c-3.4.1-6.2 1-8.5 2.7 4.7 5.8 11.3 7.4 20 4.8 8.7 2.6 15.3 1 20-4.8-2.3-1.7-5.1-2.6-8.5-2.7"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M24 15v22"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function GoalIcon({
  option,
  selected,
}: {
  option: GoalOption;
  selected: boolean;
}) {
  const color = selected ? RELAX_ACCENT : '#FFFFFF';

  if (option === 'Feel less anxious') {
    return <LotusIcon color={color} />;
  }

  const iconName = {
    'Manage daily stress': 'sunny-outline',
    'Be more present': 'person-outline',
    'Sleep more easily': 'moon-outline',
  }[option] as
    | 'sunny-outline'
    | 'person-outline'
    | 'moon-outline';

  return (
    <Ionicons
      color={color}
      name={iconName}
      size={RELAX_ONBOARDING.optionRow.iconSize}
    />
  );
}

export default function RelaxMainGoalScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<GoalOption | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;

    void getOnboardingAnswers()
      .then((answers) => {
        const saved = OPTIONS.find((option) => option === answers.main_goal);
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
      await saveOnboardingAnswers({ main_goal: selected });
      router.push('/onboarding/relax-causes' as Href);
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
      header={<RelaxStepHeader currentStep={4} onBack={() => safeGoBack(router)} />}>
      <Text style={styles.heading}>
        What&apos;s your main{'\n'}goal right now?
      </Text>

      <View style={styles.options}>
        {OPTIONS.map((option) => {
          const isSelected = selected === option;
          return (
            <RelaxChoiceRow
              icon={<GoalIcon option={option} selected={isSelected} />}
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
    fontSize: RELAX_ONBOARDING.heading.fontSize,
    fontWeight: '600',
    letterSpacing: RELAX_ONBOARDING.heading.letterSpacing,
    lineHeight: RELAX_ONBOARDING.heading.lineHeight,
  },
  options: {
    gap: RELAX_ONBOARDING.gaps.optionRows,
    marginTop: RELAX_ONBOARDING.gaps.headingToContent,
  },
});
