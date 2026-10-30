import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipGroup, FilterChip } from '@/components/FilterChip';
import {
  PassageColors,
  PassageModal,
  PassageRadius,
  PassageSpacing,
  Typography,
} from '@/constants/design';
import {
  countActiveFilters,
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

  const showLabel = useMemo(() => {
    if (isLoading || isStale || count === null) return 'Show results';
    return `Show ${count} ${count === 1 ? 'result' : 'results'}`;
  }, [count, isLoading, isStale]);

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.container}>
        <Pressable accessibilityLabel="Close filters" onPress={onClose} style={styles.backdrop} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          {subView ? (
            <Pressable
              accessibilityLabel="Back to filters"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setSubView(null)}>
              <Ionicons color={PassageColors.textPrimary} name="chevron-back" size={22} />
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
            <Ionicons color={PassageColors.textPrimary} name="close" size={22} />
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
          color={PassageColors.textSecondary}
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
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PassageModal.backdrop,
  },
  sheet: {
    backgroundColor: PassageColors.surface,
    borderTopColor: PassageColors.border,
    borderTopLeftRadius: PassageRadius.sheet,
    borderTopRightRadius: PassageRadius.sheet,
    borderTopWidth: 1,
    maxHeight: '86%',
    paddingTop: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: PassageSpacing.screenX,
  },
  title: {
    ...Typography.sectionHeading,
  },
  reset: {
    color: PassageColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
  scrollContent: {
    paddingBottom: 12,
    paddingHorizontal: PassageSpacing.screenX,
  },
  section: {
    borderTopColor: PassageColors.border,
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
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  sectionCount: {
    alignItems: 'center',
    backgroundColor: PassageColors.accent,
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 5,
  },
  sectionCountLabel: {
    color: PassageColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  seeAll: {
    color: PassageColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  sectionBody: {
    paddingBottom: 16,
  },
  hint: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  showButton: {
    alignItems: 'center',
    backgroundColor: PassageColors.accent,
    borderRadius: PassageRadius.pill,
    columnGap: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: PassageSpacing.screenX,
    marginTop: 8,
    paddingVertical: 15,
  },
  showButtonPressed: {
    backgroundColor: PassageColors.accentPressed,
  },
  showLabel: {
    color: PassageColors.background,
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
    color: PassageColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
});
