import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AppFonts } from '@/constants/theme';
import { apiClient } from '@/lib/api/client';

const backgroundImage = require('@/assets/images/4a78c0b5bcbe750563b0d0e3ecbe9951c1d0f0cc.png');

const TASKS = [
  'Morning Sunlight',
  'Breathwork',
  'Movement',
  'Hydration',
  'Deep Work',
  'Wind-down',
];

const TASK_COLORS: Record<string, { bg: string; color: string }> = {
  'Morning Sunlight': { bg: '#FFC1031A', color: '#FFC43D' },
  'Breathwork':       { bg: '#7B61FF14', color: '#7B61FF' },
  'Movement':         { bg: '#3770FC14', color: '#3770FC' },
  'Hydration':        { bg: '#2EB66814', color: '#2EB668' },
  'Deep Work':        { bg: '#FF005914', color: '#FF0059' },
  'Wind-down':        { bg: '#7B61FF14', color: '#7B61FF' },
};

export default function ChecklistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggleTask(task: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(task)) next.delete(task);
      else next.add(task);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiClient('/api/checklist', {
        method: 'POST',
        body: JSON.stringify({ completed_tasks: [...checked] }),
      });
      Alert.alert('Saved!', 'Your checklist has been updated!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}>

          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>

          <Text style={styles.title}>Checklist</Text>
          <Text style={styles.subtitle}>Daily habits</Text>

          <View style={styles.list}>
            {TASKS.map((task) => {
              const isChecked = checked.has(task);
              const colors = TASK_COLORS[task] ?? { bg: '#7B61FF14', color: '#7B61FF' };
              return (
                <Pressable
                  key={task}
                  onPress={() => toggleTask(task)}
                  style={[styles.card, isChecked && styles.cardChecked]}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.bg }]}>
                    <Image
                      source={require('@/assets/icons/dashbord-flower-icon.svg')}
                      style={[styles.icon, { tintColor: colors.color }]}
                      contentFit="contain"
                    />
                  </View>
                  <Text style={[styles.taskTitle, isChecked && styles.taskTitleChecked]}>
                    {task}
                  </Text>
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={styles.saveWrap}>
            <LinearGradient
              colors={['#6339FB', '#3770FC', '#6AAFE9']}
              locations={[0.02, 0.55, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.saveButton}>
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </LinearGradient>
          </Pressable>

        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8BFEE' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
    width: 40,
    elevation: 3,
  },
  backChevron: { color: '#173F5F', fontSize: 26, fontWeight: '300', lineHeight: 30, marginTop: -2 },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: 6,
  },
  subtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  list: { gap: 12 },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 3,
  },
  cardChecked: {
    backgroundColor: 'rgba(99,57,251,0.08)',
    borderColor: '#6339FB',
    borderWidth: 1,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: 16,
    width: 48,
  },
  icon: { height: 24, width: 24 },
  taskTitle: {
    color: '#173F5F',
    flex: 1,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  taskTitleChecked: { color: '#6339FB' },
  checkbox: {
    alignItems: 'center',
    borderColor: '#E5E5EA',
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: '#6339FB',
    borderColor: '#6339FB',
  },
  checkmark: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  saveWrap: { borderRadius: 28, height: 54, marginTop: 24, overflow: 'hidden' },
  saveButton: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  saveText: {
    color: '#FFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 18,
    fontWeight: '700',
  },
});