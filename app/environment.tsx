import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image,Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ChoiceRow } from '@/components/onboarding/OnboardingChoices';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { MODES, type ModeConfig, type ModeId } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import {
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';
import { OnboardingContinueButtonBlack } from '@/components/onboarding/OnboardingcontinueButtonBlack';

const MODE_ORDER: readonly ModeId[] = ['focus','sleep', 'relax', ];
const MODE_ONBOARDING_COPY: Record<ModeId, string> = {
  sleep: 'Restful, calming soundscapes.',
  relax: 'Warm sounds for unwinding.',
  focus: 'Clear textures for focused listening.',
};

export default function StartingModeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<ModeId | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const modes = useMemo(
    () =>
      MODE_ORDER.map((modeId) => MODES.find((mode) => mode.id === modeId)).filter(
        (mode): mode is ModeConfig => Boolean(mode)
      ),
    []
  );

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const answers = await getOnboardingAnswers();
      if (!active) return;
      setSelected(answers.startingMode);
      setHydrating(false);
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const continueOnboarding = async () => {
    if (!selected) return;

    setSaving(true);
    setSaveError(null);
    try {
      await saveOnboardingAnswers({ startingMode: selected });
      router.push('/onboarding/situation' as Href);
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
            disabled={hydrating || !selected}
            loading={saving}
            onPress={() => void continueOnboarding()}
          />
        </View>
      }
      onBack={() => router.back()}
   >
      <View style={styles.headingGroup}>
     
        <Text style={styles.heading}>Where should we begin?</Text>
        <Text style={styles.description}>
          Pick the kind of listening support that feels most useful right now.
        </Text>
      </View>

   <View style={styles.options}>
  {modes.map((mode) => {
    const isSelected = selected === mode.id;

    const config = {
      sleep: {
        icon: 'moon-waning-crescent',
        iconColor: '#F5E7C8',
        backgroundColor: '#0D1927',
        borderColor: 'rgba(93,125,160,0.45)',
        description: 'Wind down\nand sleep deeply',
      },

      focus: {
        icon: 'head-cog-outline',
        iconColor: '#CBB08A',
        backgroundColor: '#171513',
        borderColor: 'rgba(203,176,138,0.35)',
        description: 'Find flow and\nget things done',
      },

      relax: {
        icon: 'weather-sunny',
        iconColor: '#D3A55F',
        backgroundColor: '#281D12',
        borderColor: 'rgba(190,140,65,0.35)',
        description: 'Unwind and\nfeel lighter',
      },
    }[mode.id];


    return (
      <Pressable
        key={mode.id}
        onPress={() => {
          setSaveError(null);
          setSelected(mode.id);
        }}
        style={[
          styles.environmentCard,
          {
            backgroundColor: config.backgroundColor,
            borderColor: config.borderColor,
          },
        ]}
      >

        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name={config.icon as any}
            size={32}
            color={config.iconColor}
          />
        </View>


        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>
            {mode.label}
          </Text>

          <Text style={styles.cardDescription}>
            {config.description}
          </Text>
        </View>


        {isSelected && (
          <View style={styles.checkCircle}>
            <MaterialCommunityIcons
              name="check"
              size={18}
              color="#171513"
            />
          </View>
        )}

      </Pressable>
    );
  })}
</View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  artwork: {
    borderRadius: HalcyonRadius.artwork,
    height: 68,
    width: 92,
  },
  content: {
    paddingTop: 22,
  },
  description: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  environmentCard: {
  alignItems: 'center',
  borderRadius: 18,
  borderWidth: 1,
  flexDirection: 'row',
  minHeight: 112,
  paddingHorizontal: 18,
},


iconCircle: {
  alignItems: 'center',
  borderColor: 'rgba(255,255,255,0.18)',
  borderRadius: 28,
  borderWidth: 1,
  height: 56,
  justifyContent: 'center',
  width: 56,
},


cardCopy: {
  flex: 1,
  marginLeft: 18,
},


cardTitle: {
  color: HalcyonColors.textPrimary,
  fontFamily: AppFonts.displayRegular,
  fontSize: 27,
  lineHeight: 30,
},


cardDescription: {
  color: HalcyonColors.textSecondary,
  fontFamily: AppFonts.sansRegular,
  fontSize: 14,
  lineHeight: 20,
  marginTop: 5,
},


checkCircle: {
  alignItems: 'center',
  backgroundColor: '#D8B98E',
  borderRadius: 18,
  height: 36,
  justifyContent: 'center',
  width: 36,
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
  },
  headingGroup: {
    marginBottom: 28,
  },
  modeRow: {
    minHeight: 96,
    paddingLeft: 10,
  },
  options: {
    gap: 12,
  },
});
