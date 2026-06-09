import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppFonts } from '@/constants/theme';
import { SaveSuccessModal } from '@/components/profile/SaveSuccessModal';
import { favouritesApi } from '@/lib/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

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

const ALL_TOOLS = [
  { tool_id: 'box-breathing',      tool_name: 'Box Breathing',      tool_type: 'breathing',  icon: require('@/assets/icons/dashbord-breathing-icon.svg'), iconColor: '#3770FC', iconBg: '#3770FC14' },
  { tool_id: '4-7-8-sleep-reset',  tool_name: '4-7-8 Sleep Reset',  tool_type: 'breathing',  icon: require('@/assets/icons/dashbord-breathing-icon.svg'), iconColor: '#3770FC', iconBg: '#3770FC14' },
  { tool_id: 'physiological-sigh', tool_name: 'Physiological Sigh', tool_type: 'breathing',  icon: require('@/assets/icons/dashbord-breathing-icon.svg'), iconColor: '#3770FC', iconBg: '#3770FC14' },
  { tool_id: 'resonant-breathing', tool_name: 'Resonant Breathing', tool_type: 'breathing',  icon: require('@/assets/icons/dashbord-breathing-icon.svg'), iconColor: '#3770FC', iconBg: '#3770FC14' },
  { tool_id: 'focus-reset',        tool_name: 'Focus Reset',        tool_type: 'breathing',  icon: require('@/assets/icons/dashbord-breathing-icon.svg'), iconColor: '#3770FC', iconBg: '#3770FC14' },
  { tool_id: 'morning-lift',       tool_name: 'Morning Lift',       tool_type: 'breathing',  icon: require('@/assets/icons/dashbord-morning-icon.svg'),   iconColor: '#FFC43D', iconBg: '#FFC1031A' },
  { tool_id: 'urban-rain',         tool_name: 'Urban Rain',         tool_type: 'soundscape', icon: require('@/assets/icons/dashbord-clock-icon.svg'),    iconColor: '#7B61FF', iconBg: '#7B61FF14' },
  { tool_id: 'midnight-shore',     tool_name: 'Midnight Shore',     tool_type: 'soundscape', icon: require('@/assets/icons/dashbord-clock-icon.svg'),    iconColor: '#7B61FF', iconBg: '#7B61FF14' },
  { tool_id: 'forest-morning',     tool_name: 'Forest Morning',     tool_type: 'soundscape', icon: require('@/assets/icons/dashbord-clock-icon.svg'),    iconColor: '#7B61FF', iconBg: '#7B61FF14' },
  { tool_id: 'thunder-calm',       tool_name: 'Thunder Calm',       tool_type: 'soundscape', icon: require('@/assets/icons/dashbord-clock-icon.svg'),    iconColor: '#7B61FF', iconBg: '#7B61FF14' },
  { tool_id: 'morning-sunlight',   tool_name: 'Morning Sunlight',   tool_type: 'checklist',  icon: require('@/assets/icons/dashbord-flower-icon.svg'),   iconColor: '#2EB668', iconBg: '#28B92A14' },
  { tool_id: 'breathwork',         tool_name: 'Breathwork',         tool_type: 'checklist',  icon: require('@/assets/icons/dashbord-flower-icon.svg'),   iconColor: '#2EB668', iconBg: '#28B92A14' },
  { tool_id: 'movement',           tool_name: 'Movement',           tool_type: 'checklist',  icon: require('@/assets/icons/dashbord-speed-icon.svg'),    iconColor: '#2EB668', iconBg: '#28B92A14' },
  { tool_id: 'hydration',          tool_name: 'Hydration',          tool_type: 'checklist',  icon: require('@/assets/icons/dashbord-flower-icon.svg'),   iconColor: '#2EB668', iconBg: '#28B92A14' },
  { tool_id: 'deep-work',          tool_name: 'Deep Work',          tool_type: 'checklist',  icon: require('@/assets/icons/dashbord-speed-icon.svg'),    iconColor: '#2EB668', iconBg: '#28B92A14' },
  { tool_id: 'wind-down',          tool_name: 'Wind-down',          tool_type: 'checklist',  icon: require('@/assets/icons/dashbord-clock-icon.svg'),    iconColor: '#2EB668', iconBg: '#28B92A14' },
] as const;

type Tool = (typeof ALL_TOOLS)[number];

const SECTIONS = [
  { key: 'breathing',  label: 'Breathing',   color: '#3770FC' },
  { key: 'soundscape', label: 'Soundscapes', color: '#7B61FF' },
  { key: 'checklist',  label: 'Checklists',  color: '#2EB668' },
];

export default function FavouriteToolsScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Fetch existing favourites ──────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: favouritesApi.add,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favourites'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => favouritesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favourites'] }),
  });

  // ── Local selected state ───────────────────────────────────────────────────
  // Set of tool_ids that user has toggled ON locally
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [rawFavourites, setRawFavourites] = useState<any[]>([]);
  const [isLoadingFavourites, setIsLoadingFavourites] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

  // existing favourites from server: { tool_id → record id }
  const serverFavMap: Record<string, string> = {};
  rawFavourites.forEach((f: any) => {
    if (f?.tool_id) serverFavMap[f.tool_id] = f.id;
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      setSelected(null);
      setRawFavourites([]);
      setIsLoadingFavourites(true);

      favouritesApi
        .get()
        .then((response) => {
          if (!isActive) {
            return;
          }

          const favs = response?.data?.favourites ?? response?.favourites ?? [];
          const ids = favs
            .filter((f: any) => f?.tool_id)
            .map((f: any) => f.tool_id);

          setRawFavourites(favs);
          setSelected(new Set(ids));
          queryClient.setQueryData(['favourites'], response);
        })
        .catch(() => {
          if (!isActive) {
            return;
          }

          setRawFavourites([]);
          setSelected(new Set());
        })
        .finally(() => {
          if (isActive) {
            setIsLoadingFavourites(false);
          }
        });

      return () => {
        isActive = false;
      };
    }, [queryClient])
  );

function toggleTool(toolId: string) {
  console.log("Clicked:", toolId);

  setSelected((prev) => {
    const next = new Set(prev ?? []);

    if (next.has(toolId)) {
      next.delete(toolId);
      console.log("Removed");
    } else {
      next.add(toolId);
      console.log("Added");
    }

    console.log([...next]);
    return next;
  });
}

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const selectedSet = selected ?? new Set<string>();
      const toAdd = ALL_TOOLS.filter(
        (t) => selectedSet.has(t.tool_id) && !serverFavMap[t.tool_id]
      );
      const toRemove = Object.entries(serverFavMap).filter(
        ([toolId]) => !selectedSet.has(toolId)
      );

      await Promise.all([
        ...toAdd.map((t) =>
          addMutation.mutateAsync({
            tool_type: t.tool_type,
            tool_id: t.tool_id,
            tool_name: t.tool_name,
          })
        ),
        ...toRemove.map(([, id]) => removeMutation.mutateAsync(id)),
      ]);

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
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
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
          <Text style={styles.title}>Favourite tools</Text>
          <Text style={styles.subtitle}>Tap heart to select your favourites.</Text>

          {isLoadingFavourites || selected === null ? (
            <ActivityIndicator color="#7B61FF" size="large" style={{ marginTop: 40 }} />
          ) : (
            SECTIONS.map((section) => {
              const tools = ALL_TOOLS.filter((t) => t.tool_type === section.key);
              return (
                <View key={section.key} style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: section.color }]}>
                    {section.label}
                  </Text>
                  <View style={styles.card}>
                    {tools.map((tool, index) => {
                      const isFav = selected !== null && selected.has(tool.tool_id);
                      console.log(tool.tool_id, isFav);
                      return (
                        <View
                          key={tool.tool_id}
                          style={[
                            styles.row,
                            index < tools.length - 1 && styles.rowDivider,
                          ]}>
                          <View style={[styles.iconCircle, { backgroundColor: tool.iconBg }]}>
                            <Image
                              source={tool.icon}
                              style={[styles.icon, { tintColor: tool.iconColor }]}
                              contentFit="contain"
                            />
                          </View>
                          <View style={styles.rowText}>
                            <Text style={styles.rowTitle}>{tool.tool_name}</Text>
                            <Text style={styles.rowSubtitle}>{section.label}</Text>
                          </View>
                          <Pressable
                            onPress={() => toggleTool(tool.tool_id)}
                            style={styles.heartButton}>
             
<MaterialIcons
  name={isFav ? "favorite" : "favorite-border"}
  size={24}
  color={isFav ? "#FF0059" : "#DDDDDD"}
/>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}

          {/* Save button */}
          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            disabled={saving || selected === null}
            style={({ pressed }) => [
              styles.saveWrap,
              pressed && !saving && selected !== null && styles.pressed,
            ]}>
            <LinearGradient
              colors={['#6D67CE', '#528AE1', '#6AAFE9']}
              end={{ x: 1, y: 0.58 }}
              locations={[0.0254, 0.5327, 0.9044]}
              start={{ x: 0, y: 0.42 }}
              style={styles.saveButton}>
              <InnerShadow />
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Save Favourites</Text>
              )}
            </LinearGradient>
          </Pressable>

        </ScrollView>
        <SaveSuccessModal
          visible={showSavedModal}
          title="Favourites saved"
          message="Your favourite tools have been updated successfully."
          onClose={() => setShowSavedModal(false)}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8BFEE' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 76 },
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
  section: { marginBottom: 20 },
  sectionLabel: {
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    overflow: 'hidden',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowDivider: {
    borderBottomColor: 'rgba(23,63,95,0.07)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginRight: 14,
    width: 44,
  },
  icon: { height: 22, width: 22 },
  rowText: { flex: 1 },
  rowTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  rowSubtitle: {
    color: '#9A9A9A',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 1,
  },
  heartButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  heartIcon: { fontSize: 24 },
  saveWrap: {
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
  saveButton: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  saveText: {
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
