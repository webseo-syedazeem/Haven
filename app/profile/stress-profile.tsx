import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExploreButton } from '@/components/ExploreButton';
import { SaveSuccessModal } from '@/components/profile/SaveSuccessModal';
import { AppFonts } from '@/constants/theme';
import { useSetup } from '@/hooks/useSetup';
import { setupApi } from '@/lib/api';

const backgroundImage = require('@/assets/images/29dd3fece0aba2a99777eeac0658bccbe2ed402a.png');

// ── Types ─────────────────────────────────────────────────────────────────────
type Trigger = {
  key: string;
  icon: any;
};

// ── Static data ───────────────────────────────────────────────────────────────
const TRIGGERS: Trigger[] = [
  { key: 'Work/study',    icon: require('@/assets/icons/dashbord-breathing-icon.svg') },
  { key: 'Overthinking',  icon: require('@/assets/icons/dashbord-clock-icon.svg') },
  { key: 'Poor sleep',    icon: require('@/assets/icons/dashbord-clock-icon.svg') },
  { key: 'Social stress', icon: require('@/assets/icons/dashbord-flower-icon.svg') },
  { key: 'Finances',      icon: require('@/assets/icons/dashbord-heart-icon.svg') },
  { key: 'Health',        icon: require('@/assets/icons/dashbord-heart-icon.svg') },
];

const TIMING = [
  {
    key: 'Morning',
    desc: 'Often feel more stressed',
    icon: require('@/assets/icons/dashbord-morning-icon.svg'),
    iconColor: '#FFC43D',
    iconBg: '#FFC1031A',
    bars: [3, 4, 5],
  },
  {
    key: 'Evening',
    desc: 'Stress tends to rise',
    icon: require('@/assets/icons/dashbord-clock-icon.svg'),
    iconColor: '#7B61FF',
    iconBg: '#7B61FF14',
    bars: [2, 3, 4],
  },
  {
    key: 'Work hours',
    desc: 'Stress can spike',
    icon: require('@/assets/icons/dashbord-breathing-icon.svg'),
    iconColor: '#3770FC',
    iconBg: '#3770FC14',
    bars: [4, 2, 5],
  },
];

const SUPPORT_PERCENT: Record<string, number> = {
  Breathwork:  78,
  Soundscapes: 65,
  Movements:   63,
  'Check-ins': 55,
  Reflection:  70,
};

const SUPPORT_ICONS: Record<string, any> = {
  Breathwork:  require('@/assets/icons/dashbord-breathing-icon.svg'),
  Soundscapes: require('@/assets/icons/dashbord-clock-icon.svg'),
  Movements:   require('@/assets/icons/dashbord-speed-icon.svg'),
  'Check-ins': require('@/assets/icons/dashbord-heart-icon.svg'),
  Reflection:  require('@/assets/icons/dashbord-flower-icon.svg'),
};

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ bars }: { bars: number[] }) {
  return (
    <View style={barStyles.wrap}>
      {bars.map((h, i) => (
        <View key={i} style={[barStyles.bar, { height: h * 6 }]} />
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 8, backgroundColor: '#FF8FAB', borderRadius: 3 },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function StressProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Setup data for "What helped you most"
  const { data: setupData } = useSetup();
  const supportTypes: string[] =
    setupData?.data?.setup?.support_types ??
    setupData?.setup?.support_types ??
    [];

  async function saveStressProfile(stress_triggers: string[]) {
    const existing = setupData?.data?.setup;

    if (!existing) {
      Alert.alert('Setup Required', 'Please complete your setup first.');
      return;
    }

    return setupApi.update({ stress_triggers } as any);
  }

  const { data: stressData, isLoading } = useSetup();

  const saveMutation = useMutation({
    mutationFn: (triggers: string[]) => saveStressProfile(triggers),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['setup'] }),
  });

  // Local selected triggers
  const [selectedTriggers, setSelectedTriggers] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

  // Initialize from server
  useEffect(() => {
    if (!isLoading && stressData !== undefined && !initialized) {
      const triggers: string[] =
        stressData?.data?.setup?.stress_triggers ?? [];
      setSelectedTriggers(new Set(triggers));
      setInitialized(true);
    }
  }, [isLoading, stressData]);

  function toggleTrigger(key: string) {
    setSelectedTriggers((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleSave() {
    const existing = setupData?.data?.setup;
    if (!existing) {
      Alert.alert('Setup Required', 'Please complete your setup first.');
      return;
    }

    setSaving(true);
    try {
      const triggers = [...(selectedTriggers ?? [])];
      await saveMutation.mutateAsync(triggers);
      setShowSavedModal(true);
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>

          {/* Back */}
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons color="#000000" name="chevron-back" size={18} />
          </Pressable>

          {/* Header */}
          <View style={styles.headerArea}>
            <Text style={styles.title}>Stress Profile</Text>
            <Text style={styles.subtitle}>Understand your patterns</Text>
          </View>

          {/* Full-width white sheet — extends to bottom */}
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color="#7B61FF" size="large" />
            </View>
          ) : (
            <View style={[styles.whiteSheet, { paddingBottom: insets.bottom + 24 }]}>
              <>
                {/* ── Common Triggers ── */}
                <Text style={styles.sectionTitle}>Common triggers</Text>
                <View style={styles.triggerGrid}>
                  {TRIGGERS.map((t) => {
                    const isActive = selectedTriggers.has(t.key);
                    return (
                      <Pressable
                        key={t.key}
                        onPress={() => toggleTrigger(t.key)}
                        style={[styles.triggerChip, isActive && styles.triggerChipActive]}>
                        <Image
                          source={t.icon}
                          style={[
                            styles.triggerIcon,
                            { tintColor: isActive ? '#7B61FF' : '#8C8C8C' },
                          ]}
                          contentFit="contain"
                        />
                        <Text
                          numberOfLines={1}
                          style={[styles.triggerText, isActive && styles.triggerTextActive]}>
                          {t.key}
                        </Text>
                        {isActive && (
                          <View style={styles.checkCircle}>
                            <Text style={styles.checkMark}>✓</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* ── Stress Timing ── */}
                <View style={styles.timingSection}>
                  <Text style={styles.sectionTitle}>Stress Timing</Text>
                  <View style={styles.timingList}>
                    {TIMING.map((t) => (
                      <View key={t.key} style={styles.timingRow}>
                        <View style={[styles.timingIconCircle, { backgroundColor: t.iconBg }]}>
                          <Image
                            source={t.icon}
                            style={[styles.timingIcon, { tintColor: t.iconColor }]}
                            contentFit="contain"
                          />
                        </View>
                        <View style={styles.timingText}>
                          <Text style={styles.timingTitle}>{t.key}</Text>
                          <Text style={styles.timingDesc}>{t.desc}</Text>
                        </View>
                        <BarChart bars={t.bars} />
                      </View>
                    ))}
                  </View>
                </View>

                {/* ── What helped ── */}
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>What helped you most?</Text>
                {supportTypes.length === 0 ? (
                  <Text style={styles.emptyText}>Complete your setup to see insights.</Text>
                ) : (
                  <View style={styles.helpList}>
                    {supportTypes.map((s) => {
                      const pct = SUPPORT_PERCENT[s] ?? 60;
                      const icon = SUPPORT_ICONS[s];
                      return (
                        <View key={s} style={styles.helpRow}>
                          <View style={styles.helpTop}>
                            <View style={styles.helpLeft}>
                              {icon && (
                                <Image
                                  source={icon}
                                  style={[styles.helpIcon, { tintColor: '#7B61FF' }]}
                                  contentFit="contain"
                                />
                              )}
                              <Text style={styles.helpLabel}>{s}</Text>
                            </View>
                            <Text style={styles.helpPct}>{pct}%</Text>
                          </View>
                          <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${pct}%` }]} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>

              {/* Save button inside white sheet */}
              <ExploreButton
                accessibilityRole="button"
                label="Save Profile"
                loading={saving}
                disabled={saving}
                onPress={handleSave}
                style={styles.saveWrap}
              />
            </View>
          )}

        </ScrollView>
        <SaveSuccessModal
          visible={showSavedModal}
          title="Stress profile saved"
          message="Your stress profile has been updated successfully."
          onClose={() => setShowSavedModal(false)}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8BFEE' },
  safeArea: { flex: 1 },
  scroll: { paddingTop: 76 },
  headerArea: { paddingHorizontal: 20 },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  whiteSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },

  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    left: 18,
    position: 'absolute',
    top: 15,
    width: 32,
    zIndex: 3,
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 34,
    lineHeight: 42,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 12,
  },

  // Triggers
  triggerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 10,
  },
  triggerChip: {
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderColor: '#E5E5EA',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 10,
    width: '48.5%',
  },
  triggerChipActive: {
    backgroundColor: '#F0EEFF',
    borderColor: '#7B61FF',
  },
  triggerIcon: { height: 18, width: 18 },
  triggerText: {
    color: '#8C8C8C',
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  triggerTextActive: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
  },
  checkCircle: {
    alignItems: 'center',
    backgroundColor: '#7B61FF',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkMark: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  // Timing
  timingSection: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(227,227,227,0.55)',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 4,
    marginTop: 24,
    padding: 16,
    shadowColor: '#B7C1D9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  timingList: { gap: 12 },
  timingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  timingIconCircle: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  timingIcon: { height: 20, width: 20 },
  timingText: { flex: 1 },
  timingTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  timingDesc: {
    color: '#898989',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },

  // What helped
  emptyText: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  helpList: { gap: 20 },
  helpRow: { gap: 10 },
  helpTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  helpLeft: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  helpIcon: { height: 20, width: 20 },
  helpLabel: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  helpPct: {
    color: '#6FCF97',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
  },
  progressBg: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#6FCF97',
    borderRadius: 6,
    height: 8,
  },

  // Save button
  saveWrap: {
    alignSelf: 'center',
    marginBottom: 8,
    marginTop: 16,
    maxWidth: 348,
    width: '100%',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
