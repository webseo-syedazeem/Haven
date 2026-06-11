import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';


import { AppFonts } from '@/constants/theme';
import { SaveSuccessModal } from '@/components/profile/SaveSuccessModal';
import { useGoals, useSaveGoals, useUpdateGoals } from '@/hooks/useGoals';

const backgroundImage = require('@/assets/images/264ee61d943a0f70fc621c11756d688038af0dc6.png');

function InnerShadow() {
  return (
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
  );
}

// ── Goal definitions (matches backend enum exactly) ──────────────────────────
const GOALS = [
  {
    key: 'Reduce Stress',
    label: 'Reduce Stress',
    description: 'Feel calm and relaxed throughout the day',
    iconBg: '#3770FC14',
    iconColor: '#3770FC',
    icon: require('@/assets/icons/dashbord-breathing-icon.svg'),
  },
  {
    key: 'Sleep Better',
    label: 'Sleep better',
    description: 'Feel calm and relaxed throughout the day',
    iconBg: '#7B61FF14',
    iconColor: '#7B61FF',
    icon: require('@/assets/icons/dashbord-clock-icon.svg'),
  },
  {
    key: 'Self Care',
    label: 'Self Care',
    description: 'Feel calm and relaxed throughout the day',
    iconBg: '#FF005914',
    iconColor: '#FF0059',
    icon: require('@/assets/icons/dashbord-heart-icon.svg'),
  },
  {
    key: 'Improve Mood',
    label: 'Improve mood',
    description: 'Feel calm and relaxed throughout the day',
    iconBg: '#FFC1031A',
    iconColor: '#FFC43D',
    icon: require('@/assets/icons/dashbord-morning-icon.svg'),
  },
  {
    key: 'Mind Less',
    label: 'Mind less',
    description: 'Feel calm and relaxed throughout the day',
    iconBg: '#28B92A14',
    iconColor: '#2EB668',
    icon: require('@/assets/icons/dashbord-flower-icon.svg'),
  },
] as const;

type GoalKey = (typeof GOALS)[number]['key'];

// ── Screen ────────────────────────────────────────────────────────────────────
export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<Set<GoalKey>>(new Set());
  const [showSavedModal, setShowSavedModal] = useState(false);
  const hasExisting = useRef(false);
  const { data, isLoading } = useGoals();
  const { mutateAsync: saveGoalsMutation, isPending: isSaving } = useSaveGoals();
  const { mutateAsync: updateGoalsMutation, isPending: isUpdating } = useUpdateGoals();
  const saving = isSaving || isUpdating;

  // Load existing goals on mount
  useEffect(() => {
    const goals = (data?.data?.goals?.goals as GoalKey[] | undefined) ?? [];
    if (goals.length > 0) {
      hasExisting.current = true;
      setSelected(new Set(goals));
    }
  }, [data]);

  function toggleGoal(key: GoalKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleSave() {
    if (selected.size === 0) {
      Alert.alert('Select Goals', 'Please select at least one goal.');
      return;
    }
    try {
      const goals = [...selected] as GoalKey[];
      if (hasExisting.current) {
        await updateGoalsMutation(goals);
      } else {
        await saveGoalsMutation(goals);
      }
      setShowSavedModal(true);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={styles.backgroundImage}
      />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          bounces={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}>

          {/* Back button */}
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons color="#000000" name="chevron-back" size={18} />
          </Pressable>

          {/* Header */}
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.subtitle}>What Would You like to focus on?</Text>
          <Text style={styles.caption}>You can choose multiple options</Text>

          {/* Loading */}
          {isLoading ? (
            <ActivityIndicator color="#7B61FF" size="large" style={styles.loader} />
          ) : (
            <View style={styles.list}>
              {GOALS.map((goal) => {
                const isOn = selected.has(goal.key);
                return (
                  <Pressable
                    key={goal.key}
                    onPress={() => toggleGoal(goal.key)}
                    style={styles.goalRow}>

                    {/* Icon */}
                    <View style={[styles.iconCircle, { backgroundColor: goal.iconBg }]}>
                      <Image
                        source={goal.icon}
                        style={[styles.icon, { tintColor: goal.iconColor }]}
                        contentFit="contain"
                      />
                    </View>

                    {/* Text */}
                    <View style={styles.goalText}>
                      <Text style={styles.goalLabel}>{goal.label}</Text>
                      <Text style={styles.goalDesc}>{goal.description}</Text>
                    </View>

                    {/* Toggle */}
                    <Switch
                      value={isOn}
                      onValueChange={() => toggleGoal(goal.key)}
                      trackColor={{ false: '#E5E5EA', true: '#7B61FF' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#E5E5EA"
                    />
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Info note */}
          <View style={styles.noteCard}>
            <Text style={styles.noteIcon}>?</Text>
            <Text style={styles.noteText}>
              Your goals help heaven to personalize Your daily plan and insights
            </Text>
          </View>

          {/* Save button */}
          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.getStartedButton,
              pressed && !saving && styles.pressed,
            ]}>
            <LinearGradient
              colors={['#6D67CE', '#528AE1', '#6AAFE9']}
              end={{ x: 1, y: 0.58 }}
              locations={[0.0254, 0.5327, 0.9044]}
              start={{ x: 0, y: 0.42 }}
              style={styles.getStartedGradient}>
              <InnerShadow />
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.getStartedText}>Save Goals</Text>
              )}
            </LinearGradient>
          </Pressable>

        </ScrollView>
        <SaveSuccessModal
          visible={showSavedModal}
          title="Goals saved"
          message="Your focus goals have been updated successfully."
          onClose={() => setShowSavedModal(false)}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8BFEE', overflow: 'hidden' },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
  },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 76 },

  // Back
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

  // Header
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: 12,
  },
  subtitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 4,
  },
  caption: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },

  loader: { marginTop: 40 },

  // Goal list
  list: { gap: 10 },
  goalRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    flexDirection: 'row',
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: 14,
    width: 48,
  },
  icon: { height: 24, width: 24 },
  goalText: { flex: 1 },
  goalLabel: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
  goalDesc: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 1,
  },

  // Note card
  noteCard: {
    alignItems: 'center',
    backgroundColor: '#F0EEFF',
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  noteIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(123,97,255,0.18)',
    borderRadius: 12,
    color: '#7B61FF',
    fontFamily: AppFonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
    height: 24,
    lineHeight: 24,
    textAlign: 'center',
    width: 24,
  },
  noteText: {
    color: '#173F5F',
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 20,
  },

  // Save button
  getStartedButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#528ae1',
    borderRadius: 27,
    height: 54,
    marginTop: 24,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  getStartedGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  getStartedText: {
    color: '#ffffff',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
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
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
