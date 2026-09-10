import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipGroup, FilterChip } from '@/components/FilterChip';
import { HalcyonColors, HalcyonRadius, HalcyonSpacing } from '@/constants/design';
import {
  countActiveFilters,
  DURATION_MAX_MINUTES,
  DURATION_MIN_MINUTES,
  DURATION_STEP_MINUTES,
  EMPTY_FILTERS,
  FILTER_GROUPS,
  getFilterLabel,
  type FilterGroup,
  type FilterGroupKey,
  type LibraryFilters,
  type SortValue,
} from '@/constants/filters';
import { MODES } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { useLibraryCount } from '@/hooks/useLibrary';
import type { SoundscapeMode } from '@/lib/api/home';

/** Groups longer than this collapse behind a "See all" sub-view (L-04). */
const SUBVIEW_THRESHOLD = 6;

type FilterSheetProps = {
  visible: boolean;
  filters: LibraryFilters;
  sort: SortValue;
  onClose: () => void;
  onApply: (filters: LibraryFilters) => void;
};

export function FilterSheet({ visible, filters, sort, onClose, onApply }: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  // Edits are staged so nothing behind the sheet moves until Show is tapped.
  const [pending, setPending] = useState<LibraryFilters>(filters);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [subView, setSubView] = useState<FilterGroup | null>(null);

  useEffect(() => {
    if (visible) {
      setPending(filters);
      setSubView(null);
    }
  }, [filters, visible]);

  const { count, isLoading, isStale } = useLibraryCount(pending, sort, visible);
  const activeCount = countActiveFilters(pending);

  const toggleValue = (group: FilterGroupKey, value: string) => {
    setPending((current) => {
      const list = current[group];
      return {
        ...current,
        [group]: list.includes(value)
          ? list.filter((entry) => entry !== value)
          : [...list, value],
      };
    });
  };

  const toggleMode = (mode: SoundscapeMode) => {
    setPending((current) => ({
      ...current,
      modes: current.modes.includes(mode)
        ? current.modes.filter((entry) => entry !== mode)
        : [...current.modes, mode],
    }));
  };

  const minMinutes = pending.minMinutes ?? DURATION_MIN_MINUTES;
  const maxMinutes = pending.maxMinutes ?? DURATION_MAX_MINUTES;

  const showLabel = useMemo(() => {
    if (isLoading || isStale || count === null) return 'Show results';
    return `Show ${count} ${count === 1 ? 'result' : 'results'}`;
  }, [count, isLoading, isStale]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityLabel="Close filters" onPress={onClose} style={styles.backdrop} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          {subView ? (
            <Pressable
              accessibilityLabel="Back to filters"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setSubView(null)}>
              <Ionicons color={HalcyonColors.textPrimary} name="chevron-back" size={22} />
            </Pressable>
          ) : (
            <Pressable
              accessibilityLabel="Reset filters"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setPending(EMPTY_FILTERS)}>
              <Text style={styles.reset}>Reset</Text>
            </Pressable>
          )}

          <Text style={styles.title}>{subView ? subView.title : 'Filters'}</Text>

          <Pressable
            accessibilityLabel="Close filters"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onClose}>
            <Ionicons color={HalcyonColors.textPrimary} name="close" size={22} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {subView ? (
            /* L-04: one group, expanded into its own multi-select view. */
            <ChipGroup>
              {subView.values.map((value) => (
                <FilterChip
                  isExclusion={subView.isExclusion}
                  key={value}
                  label={getFilterLabel(subView.key, value)}
                  onPress={() => toggleValue(subView.key, value)}
                  selected={pending[subView.key].includes(value)}
                />
              ))}
            </ChipGroup>
          ) : (
            <>
              <Section
                collapsed={!!collapsed.modes}
                onToggle={() =>
                  setCollapsed((current) => ({ ...current, modes: !current.modes }))
                }
                title="Mode">
                <ChipGroup>
                  {MODES.map((mode) => (
                    <FilterChip
                      key={mode.id}
                      label={mode.label}
                      onPress={() => toggleMode(mode.id)}
                      selected={pending.modes.includes(mode.id)}
                    />
                  ))}
                </ChipGroup>
              </Section>

              {FILTER_GROUPS.map((group) => {
                const selected = pending[group.key];
                const needsSubView = group.expandable && group.values.length > SUBVIEW_THRESHOLD;
                const visibleValues = needsSubView
                  ? group.values.slice(0, SUBVIEW_THRESHOLD)
                  : group.values;

                return (
                  <Section
                    collapsed={!!collapsed[group.key]}
                    count={selected.length}
                    hint={group.hint}
                    key={group.key}
                    onSeeAll={needsSubView ? () => setSubView(group) : undefined}
                    onToggle={() =>
                      setCollapsed((current) => ({
                        ...current,
                        [group.key]: !current[group.key],
                      }))
                    }
                    title={group.title}>
                    <ChipGroup>
                      {visibleValues.map((value) => (
                        <FilterChip
                          isExclusion={group.isExclusion}
                          key={value}
                          label={getFilterLabel(group.key, value)}
                          onPress={() => toggleValue(group.key, value)}
                          selected={selected.includes(value)}
                        />
                      ))}
                    </ChipGroup>
                  </Section>
                );
              })}

              <Section
                collapsed={!!collapsed.duration}
                onToggle={() =>
                  setCollapsed((current) => ({ ...current, duration: !current.duration }))
                }
                title="Duration">
                <Text style={styles.durationValue}>
                  {minMinutes} – {maxMinutes} min
                </Text>

                {/*
                  Two stacked single-handle sliders rather than a true two-thumb
                  control: @react-native-community/slider has one handle, and a
                  gesture-driven range slider is not worth the risk here.
                */}
                <Text style={styles.sliderLabel}>Minimum</Text>
                <Slider
                  maximumTrackTintColor="rgba(255,255,255,0.16)"
                  maximumValue={DURATION_MAX_MINUTES}
                  minimumTrackTintColor={HalcyonColors.accent}
                  minimumValue={DURATION_MIN_MINUTES}
                  onValueChange={(value) =>
                    setPending((current) => ({
                      ...current,
                      minMinutes: value <= DURATION_MIN_MINUTES ? null : value,
                      maxMinutes:
                        current.maxMinutes !== null && value > current.maxMinutes
                          ? value
                          : current.maxMinutes,
                    }))
                  }
                  step={DURATION_STEP_MINUTES}
                  style={styles.slider}
                  thumbTintColor={HalcyonColors.accent}
                  value={minMinutes}
                />

                <Text style={styles.sliderLabel}>Maximum</Text>
                <Slider
                  maximumTrackTintColor="rgba(255,255,255,0.16)"
                  maximumValue={DURATION_MAX_MINUTES}
                  minimumTrackTintColor={HalcyonColors.accent}
                  minimumValue={DURATION_MIN_MINUTES}
                  onValueChange={(value) =>
                    setPending((current) => ({
                      ...current,
                      maxMinutes: value >= DURATION_MAX_MINUTES ? null : value,
                      minMinutes:
                        current.minMinutes !== null && value < current.minMinutes
                          ? value
                          : current.minMinutes,
                    }))
                  }
                  step={DURATION_STEP_MINUTES}
                  style={styles.slider}
                  thumbTintColor={HalcyonColors.accent}
                  value={maxMinutes}
                />
              </Section>
            </>
          )}
        </ScrollView>

        <Pressable
          accessibilityLabel={showLabel}
          accessibilityRole="button"
          onPress={() => {
            onApply(pending);
            onClose();
          }}
          style={({ pressed }) => [styles.showButton, pressed && styles.showButtonPressed]}>
          <Text style={styles.showLabel}>{showLabel}</Text>
          {activeCount > 0 && (
            <View style={styles.showBadge}>
              <Text style={styles.showBadgeLabel}>{activeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

function Section({
  title,
  hint,
  count,
  collapsed,
  onToggle,
  onSeeAll,
  children,
}: {
  title: string;
  hint?: string;
  count?: number;
  collapsed: boolean;
  onToggle: () => void;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Pressable
        accessibilityLabel={`${collapsed ? 'Expand' : 'Collapse'} ${title}`}
        accessibilityRole="button"
        onPress={onToggle}
        style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!count && (
          <View style={styles.sectionCount}>
            <Text style={styles.sectionCountLabel}>{count}</Text>
          </View>
        )}
        <View style={styles.sectionSpacer} />
        {!!onSeeAll && !collapsed && (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onSeeAll}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        )}
        <Ionicons
          color={HalcyonColors.textSecondary}
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={17}
        />
      </Pressable>

      {!collapsed && (
        <View style={styles.sectionBody}>
          {!!hint && <Text style={styles.hint}>{hint}</Text>}
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(4,4,6,0.62)',
    flex: 1,
  },
  sheet: {
    backgroundColor: HalcyonColors.surface,
    borderTopColor: HalcyonColors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '86%',
    paddingTop: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 27,
  },
  reset: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
  scrollContent: {
    paddingBottom: 12,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  section: {
    borderTopColor: HalcyonColors.border,
    borderTopWidth: 1,
    paddingVertical: 6,
  },
  sectionHeader: {
    alignItems: 'center',
    columnGap: 8,
    flexDirection: 'row',
    paddingVertical: 14,
  },
  sectionSpacer: {
    flex: 1,
  },
  sectionTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  sectionCount: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 5,
  },
  sectionCountLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  seeAll: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  sectionBody: {
    paddingBottom: 16,
  },
  hint: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  durationValue: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
  sliderLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 10,
  },
  slider: {
    height: 34,
    width: '100%',
  },
  showButton: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.pill,
    columnGap: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: HalcyonSpacing.screenX,
    marginTop: 8,
    paddingVertical: 15,
  },
  showButtonPressed: {
    backgroundColor: HalcyonColors.accentPressed,
  },
  showLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  showBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,11,13,0.22)',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 6,
  },
  showBadgeLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
});
