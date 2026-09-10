import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { getFilterGroupValues } from '@/constants/filters';
import { AppFonts } from '@/constants/theme';
import { getOnboardingAnswers, saveOnboardingAnswers } from '@/lib/onboarding';
import { OnboardingContinueButtonBlack } from '@/components/onboarding/OnboardingcontinueButtonBlack';

const ENVIRONMENT_ARTWORK: Record<string, ImageSourcePropType> = {
  rain: require('@/assets/images/environment_images_pack/rain.webp'),
  forest: require('@/assets/images/environment_images_pack/forest.webp'),
  ocean: require('@/assets/images/environment_images_pack/ocean.webp'),
  mountains: require('@/assets/images/environment_images_pack/mountains.webp'),
  city: require('@/assets/images/environment_images_pack/city.webp'),
  indoor: require('@/assets/images/environment_images_pack/library.webp'),
  cabin: require('@/assets/images/environment_images_pack/cabin.webp'),
  desert: require('@/assets/images/environment_images_pack/desert.webp'),
};
const OPTIONS = getFilterGroupValues('environments');

export default function EnvironmentsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    void getOnboardingAnswers().then((answers) => setSelected(answers.environments));
  }, []);

  const toggle = (value: string) => {
    setSaveError('');
    setSelected((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const continueFlow = async () => {
    if (!selected.length || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveOnboardingAnswers({
        environments: selected,
        // O8 is the positive-sound choice in the supplied flow as well as the
        // environment choice, so the same vocabulary feeds recommendation scoring.
        preferredSounds: selected,
      });
      router.push('/onboarding/sounds-to-avoid' as Href);
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
            disabled={!selected.length}
            loading={saving}
            onPress={() => void continueFlow()}
          />
        </View>
      }
      onBack={() => router.back()}
    >
      <Text style={styles.heading}>Which sounds feel right?</Text>
      <Text style={styles.hint}>Choose all that apply.</Text>

      <View style={styles.grid}>
      {OPTIONS.map((value) => {
          const isSelected = selected.includes(value);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={value}
              onPress={() => toggle(value)}
              style={({ pressed }) => [
                styles.tile,
                isSelected && styles.tileSelected,
                pressed && styles.pressed,
              ]}>
              <ImageBackground
                imageStyle={styles.tileImage}
                resizeMode="cover"
               source={ENVIRONMENT_ARTWORK[value.toLowerCase()]}
                style={styles.tileBackground}>
                <View style={styles.scrim} />
                {isSelected ? (
                  <View style={styles.check}>
                    <Ionicons color={HalcyonColors.background} name="checkmark" size={13} />
                  </View>
                ) : null}
                <Text style={styles.tileLabel}>{value}</Text>
              </ImageBackground>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  check: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 9,
    top: 9,
    width: 20,
  },
  error: {
    color: '#DFA196',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  footerContent: { gap: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
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
    lineHeight: 19,
    marginTop: 6,
  },
  pressed: { opacity: 0.78 },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,8,10,0.38)',
  },
  tile: {
    aspectRatio: 0.82,
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.artwork,
    borderWidth: 1,
    flexBasis: '30%',
    flexGrow: 1,
    maxWidth: '32%',
    overflow: 'hidden',
  },
  tileBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 10,
  },
  tileImage: { borderRadius: HalcyonRadius.artwork },
  tileLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  tileSelected: {
    borderColor: HalcyonColors.accent,
    borderWidth: 2,
  },
});
