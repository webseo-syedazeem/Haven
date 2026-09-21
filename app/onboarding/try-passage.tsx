import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import type { ModeId } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { getOnboardingAnswers } from '@/lib/onboarding';

const brandIcon = require('@/assets/images/passage-brand-assets/screens-icon.webp');
const tokyoRainImg = require('@/assets/images/preview-tokyo-rain.jpg');
const libraryDuskImg = require('@/assets/images/preview-library-dusk.jpg');
const nightTrainImg = require('@/assets/images/preview-night-train.jpg');

type SoundscapePreview = {
  id: string;
  title: string;
  tags: string;
  image: ImageSourcePropType;
  duration: string;
};

const PREVIEWS: SoundscapePreview[] = [
  {
    id: 'tokyo-rain',
    title: 'Tokyo Rain',
    tags: 'Rain, room tone, distant city',
    image: tokyoRainImg,
    duration: '1:00',
  },
  {
    id: 'library-dusk',
    title: 'Library at Dusk',
    tags: 'Fire, pages, quiet room',
    image: libraryDuskImg,
    duration: '1:00',
  },
  {
    id: 'night-train',
    title: 'Night Train',
    tags: 'Carriage rhythm, soft rain',
    image: nightTrainImg,
    duration: '1:00',
  },
];

const WAVE_BAR_HEIGHTS = [
  4, 8, 14, 10, 18, 22, 16, 8, 12, 19, 24, 15, 9, 14, 20, 17, 11, 7, 13, 18, 12, 6, 10, 15, 8, 4,
];

function Waveform({ active, progress = 0.4 }: { active: boolean; progress?: number }) {
  const total = WAVE_BAR_HEIGHTS.length;
  const filledCount = Math.floor(total * progress);

  return (
    <View style={styles.waveformContainer}>
      {WAVE_BAR_HEIGHTS.map((height, i) => {
        const isFilled = active && i < filledCount;
        return (
          <View
            key={i}
            style={[
              styles.waveBar,
              { height },
              isFilled ? styles.waveBarFilled : styles.waveBarDim,
            ]}
          />
        );
      })}
    </View>
  );
}

export default function TryPassageScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId>('focus');
  const [activeTrackId, setActiveTrackId] = useState<string>('tokyo-rain');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    void getOnboardingAnswers().then((answers) => {
      if (!active) return;
      setMode(answers.startingMode || 'focus');
    });
    return () => {
      active = false;
    };
  }, []);

  const toggleTrack = (id: string) => {
    if (activeTrackId === id) {
      setIsPlaying((prev) => !prev);
    } else {
      setActiveTrackId(id);
      setIsPlaying(true);
    }
  };

  const planLabel = `CONTINUE TO MY ${mode.toUpperCase()} PLAN`;

  const customHeader = (
    <View style={styles.headerCentered}>
      <Image source={brandIcon} style={styles.brandIcon} />
      <Text style={styles.brandText}>Passage</Text>
    </View>
  );

  return (
    <OnboardingScaffold
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.footerContainer}>
          <OnboardingContinueButton
            label={planLabel}
            onPress={() => router.push('/welcome' as Href)}
            showArrow
          />
          <Text style={styles.footerSubtext}>Your subscription options are shown next.</Text>
        </View>
      }
      header={customHeader}>
      <Text style={styles.heading}>Hear where {mode} could take you.</Text>
      <Text style={styles.subheading}>Preview three one-minute soundscapes.</Text>

      <View style={styles.list}>
        {PREVIEWS.map((item) => {
          const isActive = activeTrackId === item.id;
          const playing = isActive && isPlaying;

          return (
            <Pressable
              key={item.id}
              onPress={() => toggleTrack(item.id)}
              style={[styles.card, isActive && styles.cardActive]}>
              <Image source={item.image} style={styles.cardImage} />

              <View style={styles.cardRight}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardTags}>{item.tags}</Text>

                <View style={styles.playerRow}>
                  <View style={[styles.playButton, isActive && styles.playButtonActive]}>
                    <Ionicons
                      color={isActive ? '#0B0B0D' : '#FFFFFF'}
                      name={playing ? 'pause' : 'play'}
                      size={16}
                      style={!playing ? styles.playIconOffset : undefined}
                    />
                  </View>

                  <Waveform active={isActive} progress={playing ? 0.42 : 0} />

                  <Text style={styles.timeText}>
                    {isActive ? (playing ? '0:24 / 1:00' : '0:24 / 1:00') : item.duration}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  brandIcon: {
    height: 22,
    resizeMode: 'contain',
    width: 38,
  },
  brandText: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginLeft: 9,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#0F1317',
    borderColor: '#1E2328',
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    padding: 12,
  },
  cardActive: {
    borderColor: '#F4B34C',
  },
  cardImage: {
    borderRadius: 10,
    height: 68,
    resizeMode: 'cover',
    width: 68,
  },
  cardRight: {
    flex: 1,
    marginLeft: 14,
  },
  cardTags: {
    color: '#8A8A8E',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
  },
  content: {
    paddingBottom: 24,
    paddingTop: 12,
  },
  footerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  footerSubtext: {
    color: '#8A8A8E',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  headerCentered: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 6,
    width: '100%',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 34,
    fontWeight: '400',
    letterSpacing: -0.3,
    lineHeight: 40,
    marginTop: 18,
    textAlign: 'left',
  },
  list: {
    gap: 12,
    marginTop: 20,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: '#24282E',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  playButtonActive: {
    backgroundColor: '#F4B34C',
  },
  playIconOffset: {
    marginLeft: 2,
  },
  playerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  subheading: {
    color: '#8A8A8E',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  timeText: {
    color: '#8A8A8E',
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    minWidth: 32,
    textAlign: 'right',
  },
  waveBar: {
    borderRadius: 1,
    width: 2,
  },
  waveBarDim: {
    backgroundColor: '#353A40',
  },
  waveBarFilled: {
    backgroundColor: '#F4B34C',
  },
  waveformContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    height: 24,
  },
});
