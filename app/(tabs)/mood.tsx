import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';
import {
  createMoodWithFallbacks,
  getLatestMood,
  getMoods,
  MoodAuthError,
  type MoodRecord,
} from '@/services/moodService';

const backgroundImage = require('@/assets/images/mood-page-backgorund-image.png');
const MOOD_UPDATE_COOLDOWN_MS = 6 * 60 * 60 * 1000;

type MoodOption = {
  description: string;
  icon: number;
  label: string;
  tone: string;
};

type MoodEntry = {
  id: string;
  label: string;
  createdAt: string;
};

const moodOptions: MoodOption[] = [
  {
    description: 'Feeling tense',
    icon: require('@/assets/images/stressed-icon.svg'),
    label: 'Stressed',
    tone: '#FD5728',
  },
  {
    description: 'Feeling calm and balanced',
    icon: require('@/assets/images/peace-icon.svg'),
    label: 'Peace',
    tone: '#2EB668',
  },
  {
    description: 'Feeling steady',
    icon: require('@/assets/images/neutral-icon.svg'),
    label: 'Neutral',
    tone: '#8C8C8C',
  },
  {
    description: 'Feeling positive and light',
    icon: require('@/assets/images/happy-icon.svg'),
    label: 'Happy',
    tone: '#E96FC0',
  },
  {
    description: 'Feeling low',
    icon: require('@/assets/images/tired.svg'),
    label: 'Sad',
    tone: '#EF4D4D',
  },
];

function getMoodOption(label: string) {
  const normalizedValue = label.trim().toLowerCase();
  const normalizedLabel =
    normalizedValue === 'anxious' ||
    normalizedValue === 'overwhelmed' ||
    normalizedValue === 'stress' ||
    normalizedValue === 'stressed' ||
    normalizedValue === 'tense'
      ? 'Stressed'
      : normalizedValue === 'calm' || normalizedValue === 'peace'
        ? 'Peace'
        : normalizedValue === 'neutral'
          ? 'Neutral'
          : normalizedValue === 'energised' || normalizedValue === 'energized' || normalizedValue === 'happy'
            ? 'Happy'
            : normalizedValue === 'low' || normalizedValue === 'sad'
              ? 'Sad'
              : label;

  return moodOptions.find((option) => option.label === normalizedLabel) ?? moodOptions[1];
}

function getMoodDate(entry: MoodRecord) {
  return entry.updated_at ?? entry.updatedAt ?? entry.created_at ?? entry.createdAt ?? entry.date ?? new Date().toISOString();
}

function normalizeMoodEntry(entry: MoodRecord): MoodEntry | null {
  if (!entry.mood || typeof entry.mood !== 'string') {
    return null;
  }

  return {
    createdAt: getMoodDate(entry),
    id: String(entry.id ?? `${entry.mood}-${getMoodDate(entry)}`),
    label: getMoodOption(entry.mood).label,
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [latestMood, setLatestMood] = useState<MoodEntry | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingMood, setIsUpdatingMood] = useState(false);
  const [updateMoodMessage, setUpdateMoodMessage] = useState('');
  const [selectedMood, setSelectedMood] = useState('Peace');
  const latestOption = latestMood ? getMoodOption(latestMood.label) : moodOptions[1];
  const shouldShowCheckIn = !latestMood || isUpdatingMood;
  const commonMood = useMemo(() => {
    if (!history.length) {
      return 'Peace';
    }

    const counts = history.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.label] = (accumulator[item.label] ?? 0) + 1;
      return accumulator;
    }, {});
    return Object.entries(counts).sort((first, second) => second[1] - first[1])[0]?.[0] ?? 'Peace';
  }, [history]);

  useEffect(() => {
    let isMounted = true;

    async function loadMoodData() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [latest, moods] = await Promise.all([getLatestMood(), getMoods()]);

        if (!isMounted) {
          return;
        }

        const normalizedLatest = latest ? normalizeMoodEntry(latest) : null;
        const normalizedHistory = moods
          .map(normalizeMoodEntry)
          .filter((entry): entry is MoodEntry => Boolean(entry))
          .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());

        setLatestMood(normalizedLatest ?? normalizedHistory[0] ?? null);
        setHistory(normalizedHistory);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof MoodAuthError) {
          setErrorMessage(error.message);
          router.replace('/login');
        } else {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load mood history.');
        }
      } finally {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      }
    }

    void loadMoodData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleDone = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const savedMood = await createMoodWithFallbacks(selectedMood);
      const [latest, moods] = await Promise.all([getLatestMood(), getMoods()]);
      const savedMoodId = savedMood?.id === undefined ? null : String(savedMood.id);
      const normalizedLatest = latest ? normalizeMoodEntry(latest) : null;
      const displayLatest = normalizedLatest
        ? {
            ...normalizedLatest,
            label:
              savedMoodId === null || normalizedLatest.id === savedMoodId
                ? selectedMood
                : normalizedLatest.label,
          }
        : null;
      const normalizedHistory = moods
        .map(normalizeMoodEntry)
        .filter((entry): entry is MoodEntry => Boolean(entry))
        .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
        .map((entry, index) =>
          (savedMoodId !== null && entry.id === savedMoodId) || (savedMoodId === null && index === 0)
            ? { ...entry, label: selectedMood }
            : entry
        );

      setLatestMood(displayLatest ?? normalizedHistory[0] ?? null);
      setHistory(normalizedHistory);
      setIsUpdatingMood(false);
    } catch (error) {
      if (error instanceof MoodAuthError) {
        setErrorMessage(error.message);
        router.replace('/login');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to save mood.');
        setIsUpdatingMood(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMoodPress = () => {
    if (latestMood) {
      const latestTime = new Date(latestMood.createdAt).getTime();
      const canUpdate = Number.isNaN(latestTime)
        ? true
        : Date.now() - latestTime >= MOOD_UPDATE_COOLDOWN_MS;

      if (!canUpdate) {
        setUpdateMoodMessage('You can only log your mood once every 6 hours');
        return;
      }
    }

    setUpdateMoodMessage('');
    setErrorMessage('');
    setIsUpdatingMood(true);
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.loadingState}>
            <ActivityIndicator color="#0D6FD0" />
            <Text style={styles.loadingText}>Loading mood history...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (errorMessage && !isUpdatingMood && !latestMood) {
    return (
      <View style={styles.screen}>
        <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.loadingState}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setIsLoading(true);
                setErrorMessage('');
                void Promise.all([getLatestMood(), getMoods()])
                  .then(([latest, moods]) => {
                    const normalizedLatest = latest ? normalizeMoodEntry(latest) : null;
                    const normalizedHistory = moods
                      .map(normalizeMoodEntry)
                      .filter((entry): entry is MoodEntry => Boolean(entry))
                      .sort(
                        (first, second) =>
                          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
                      );
                    setLatestMood(normalizedLatest ?? normalizedHistory[0] ?? null);
                    setHistory(normalizedHistory);
                  })
                  .catch((error) => {
                    setErrorMessage(error instanceof Error ? error.message : 'Unable to load mood history.');
                  })
                  .finally(() => setIsLoading(false));
              }}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (shouldShowCheckIn) {
    return (
      <View style={styles.screen}>
        <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView
            bounces={false}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 112 }]}
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>{`How are you feeling\ntoday?`}</Text>
              <Text style={styles.subtitle}>Choose one option</Text>
            </View>

            <View style={styles.options}>
              {moodOptions.map((option) => {
                const isSelected = selectedMood === option.label;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={option.label}
                    onPress={() => setSelectedMood(option.label)}
                    style={({ pressed }) => [
                      styles.optionCard,
                      isSelected && styles.selectedOption,
                      pressed && (isSelected ? styles.selectedPressedOption : styles.pressed),
                    ]}>
                    <View style={styles.iconCircle}>
                      <Image source={option.icon} style={styles.optionIcon} contentFit="contain" />
                    </View>
                    <Text style={styles.optionText}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {!!errorMessage && <Text style={styles.formErrorText}>{errorMessage}</Text>}

            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={handleDone}
              style={({ pressed }) => [
                styles.doneButton,
                isSaving && styles.disabledButton,
                pressed && styles.pressed,
              ]}>
              <LinearGradient
                colors={['#5AA1E2', '#0D6FD0']}
                end={{ x: 0, y: 1 }}
                locations={[0.0379, 0.75]}
                start={{ x: 0, y: 0 }}
                style={styles.doneGradient}>
                <View pointerEvents="none" style={styles.innerShadow}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                    end={{ x: 0, y: 1 }}
                    start={{ x: 0, y: 0 }}
                    style={styles.innerShadowTop}
                  />
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                    end={{ x: 1, y: 0 }}
                    start={{ x: 0, y: 0 }}
                    style={styles.innerShadowLeft}
                  />
                </View>
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.doneText}>Done</Text>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.historyContent, { paddingBottom: insets.bottom + 112 }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Mood History</Text>
            <Text style={styles.historySubtitle}>Track how your feelings change over time</Text>
          </View>

          <LinearGradient
            colors={['rgba(255,255,255,0.92)', 'rgba(244,232,255,0.88)']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.latestCard}>
            <Text style={styles.latestBadge}>Latest Mood</Text>
            <View style={styles.latestBody}>
              <View style={[styles.latestIconWrap, { backgroundColor: `${latestOption.tone}18` }]}>
                <Image source={latestOption.icon} style={styles.latestIcon} contentFit="contain" />
              </View>
              <View style={styles.latestCopy}>
                <Text style={styles.latestMood}>{latestMood.label}</Text>
                <Text style={styles.latestText}>Your most recent check-in</Text>
                <View style={styles.latestMeta}>
                  <Ionicons color="#54555A" name="calendar-outline" size={16} />
                  <Text style={styles.latestMetaText}>{formatDate(latestMood.createdAt)}</Text>
                  <Text style={styles.latestDot}>-</Text>
                  <Ionicons color="#54555A" name="time-outline" size={16} />
                  <Text style={styles.latestMetaText}>{formatTime(latestMood.createdAt)}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.historySectionHeader}>
            <Text style={styles.sectionHeading}>Mood History List</Text>
          </View>

          <View style={styles.historyList}>
            {history.slice(0, 5).map((entry) => {
              const option = getMoodOption(entry.label);

              return (
                <View key={entry.id} style={styles.historyRow}>
                  <View style={[styles.historyMoodIconWrap, { backgroundColor: `${option.tone}18` }]}>
                    <Image source={option.icon} style={styles.historyMoodIcon} contentFit="contain" />
                  </View>
                  <View style={styles.historyRowCopy}>
                    <Text style={styles.historyMoodTitle}>{entry.label}</Text>
                    <Text style={styles.historyMoodText}>{option.description}</Text>
                  </View>
                  <View style={styles.historyDateBlock}>
                    <Text style={styles.historyDate}>{formatDate(entry.createdAt)}</Text>
                    <View style={styles.historyTimeRow}>
                      <Ionicons color="#54555A" name="time-outline" size={14} />
                      <Text style={styles.historyTime}>{formatTime(entry.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <LinearGradient
            colors={['rgba(255,255,255,0.86)', 'rgba(238,232,255,0.86)']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.weekSummaryCard}>
            <View style={styles.weekSummaryIcon}>
              <Ionicons color="#7B61FF" name="bar-chart" size={25} />
            </View>
            <View style={styles.weekSummaryCopy}>
              <Text style={styles.weekSummaryTitle}>This week</Text>
              <View style={styles.weekSummaryLine}>
                <Ionicons color="#7B61FF" name="checkmark-circle" size={18} />
                <Text style={styles.weekSummaryText}>{history.length} mood check-ins</Text>
              </View>
              <View style={styles.weekSummaryLine}>
                <Ionicons color="#2EB668" name="happy-outline" size={18} />
                <Text style={styles.weekSummaryText}>
                  Most common mood: <Text style={styles.commonMood}>{commonMood}</Text>
                </Text>
              </View>
            </View>
          </LinearGradient>

          {!!updateMoodMessage && <Text style={styles.updateMoodMessage}>{updateMoodMessage}</Text>}

          <Pressable
            accessibilityRole="button"
            onPress={handleUpdateMoodPress}
            style={({ pressed }) => [styles.updateButton, pressed && styles.pressed]}>
            <LinearGradient
              colors={['#5AA1E2', '#0D6FD0']}
              end={{ x: 0, y: 1 }}
              locations={[0.0379, 0.75]}
              start={{ x: 0, y: 0 }}
              style={styles.doneGradient}>
              <View pointerEvents="none" style={styles.innerShadow}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                  end={{ x: 0, y: 1 }}
                  start={{ x: 0, y: 0 }}
                  style={styles.innerShadowTop}
                />
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                  end={{ x: 1, y: 0 }}
                  start={{ x: 0, y: 0 }}
                  style={styles.innerShadowLeft}
                />
              </View>
              <Text style={styles.doneText}>Update Mood</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  commonMood: {
    color: '#2EB668',
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 17,
    paddingTop: 60,
  },
  doneButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0d6fd0',
    borderRadius: 27,
    elevation: 0,
    height: 54,
    marginTop: 22,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  doneGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  doneText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.72,
  },
  errorText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 31,
  },
  formErrorText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: 'center',
  },
  historyContent: {
    paddingHorizontal: 18,
    paddingTop: 48,
  },
  historyDate: {
    color: '#54555A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'right',
  },
  historyDateBlock: {
    alignItems: 'flex-end',
    gap: 5,
  },
  historyHeader: {
    alignItems: 'center',
    marginBottom: 26,
  },
  historyList: {
    gap: 10,
  },
  historyMoodIcon: {
    height: 25,
    width: 25,
  },
  historyMoodIconWrap: {
    alignItems: 'center',
    borderRadius: 18,
    height: 35,
    justifyContent: 'center',
    width: 35,
  },
  historyMoodText: {
    color: '#000000',
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  historyMoodTitle: {
    color: '#000000',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  historyRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
  },
  historyRowCopy: {
    flex: 1,
  },
  historySectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historySubtitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 6,
    textAlign: 'center',
  },
  historyTime: {
    color: '#54555A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  historyTimeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  historyTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 42,
    lineHeight: 52,
    textAlign: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#FD572814',
    borderRadius: 12,
    gap: 10,
    height: 48,
    justifyContent: 'center',
    padding: 4,
    width: 48,
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
  },
  innerShadowLeft: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 4,
    width: 16,
  },
  innerShadowTop: {
    height: 16,
    left: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  latestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#7B61FF',
    borderRadius: 8,
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 14,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  latestBody: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  latestCard: {
    borderColor: '#8A80FF',
    borderRadius: 24,
    borderWidth: 2,
    marginBottom: 28,
    padding: 18,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
  },
  latestCopy: {
    flex: 1,
  },
  latestDot: {
    color: '#54555A',
    fontSize: 16,
    lineHeight: 18,
  },
  latestIcon: {
    height: 60,
    width: 60,
  },
  latestIconWrap: {
    alignItems: 'center',
    borderRadius: 38,
    height: 75,
    justifyContent: 'center',
    width: 75,
  },
  latestMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  latestMetaText: {
    color: '#54555A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  latestMood: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 34,
    lineHeight: 42,
  },
  latestText: {
    color: '#54555A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  optionCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 16,
    height: 75,
    paddingHorizontal: 17,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    width: '100%',
  },
  optionIcon: {
    height: 31.5,
    width: 31.5,
  },
  optionText: {
    color: '#000000',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 24,
  },
  options: {
    gap: 10,
    maxWidth: 348,
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: '#0D6FD0',
    borderRadius: 18,
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    backgroundColor: '#F9E8DE',
    flex: 1,
    overflow: 'hidden',
  },
  sectionHeading: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 25,
    lineHeight: 35,
    textAlign: 'center',
    width: '100%',
  },
  selectedOption: {
    borderColor: '#0D6FD0',
    borderWidth: 2,
    elevation: 5,
    shadowColor: '#0D6FD0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    transform: [{ scale: 1.05 }],
  },
  selectedPressedOption: {
    opacity: 0.9,
    transform: [{ scale: 1.03 }],
  },
  subtitle: {
    color: '#54555A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 34,
    textAlign: 'center',
  },
  updateButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0d6fd0',
    borderRadius: 27,
    elevation: 0,
    height: 54,
    marginTop: 16,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  updateMoodMessage: {
    backgroundColor: '#EF4D4D',
    borderRadius: 500,
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 12,
    overflow: 'hidden',
    padding: 5,
    textAlign: 'center',
  },
  weekSummaryCard: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 18,
    marginTop: 14,
    padding: 18,
  },
  weekSummaryCopy: {
    flex: 1,
    gap: 10,
  },
  weekSummaryIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  weekSummaryLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  weekSummaryText: {
    color: '#54555A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  weekSummaryTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
});

