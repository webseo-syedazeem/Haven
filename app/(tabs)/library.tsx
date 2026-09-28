import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState } from '@/components/EmptyState';
import { FilterChip } from '@/components/FilterChip';
import { FilterSheet } from '@/components/FilterSheet';
import { SortSheet } from '@/components/SortSheet';
import { SoundscapeRow, SoundscapeRowSkeletonList } from '@/components/SoundscapeRow';
import { HalcyonColors, HalcyonRadius, HalcyonSpacing, Typography } from '@/constants/design';
import {
  countActiveFilters,
  EMPTY_FILTERS,
  getSortLabel,
  toActiveChips,
  type LibraryFilters,
  type SortValue,
} from '@/constants/filters';
import { AppFonts } from '@/constants/theme';
import { useTabContentInset } from '@/hooks/use-bottom-safe-spacing';
import { useFavouriteIds, useToggleFavourite } from '@/hooks/useFavourites';
import { useLibraryResults, useSearchSuggestions } from '@/hooks/useLibrary';
import type { Soundscape } from '@/lib/api/home';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

export default function LibraryScreen() {
  const router = useRouter();
  const bottomInset = useTabContentInset();
  const { playSoundscape } = usePlayerActions();
  const inputRef = useRef<TextInput>(null);

  const [draftQuery, setDraftQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortValue>('recommended');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);

  const activeCount = countActiveFilters(filters);
  const hasActiveFilters = activeCount > 0;
  const activeChips = useMemo(() => toActiveChips(filters), [filters]);

  const { results, totalCount, isSearching, isLoading, isFetching, isError, refetch } =
    useLibraryResults(committedQuery, filters, sort, hasActiveFilters);

  // Suggestions only while the field is focused and nothing is committed yet.
  const showSuggestions = isFocused && draftQuery.trim().length >= 2 && draftQuery !== committedQuery;
  const suggestions = useSearchSuggestions(draftQuery, showSuggestions);

  const favouriteIds = useFavouriteIds();
  const { toggleFavourite } = useToggleFavourite();

  const commitSearch = useCallback((value: string) => {
    setDraftQuery(value);
    setCommittedQuery(value);
    setIsFocused(false);
    Keyboard.dismiss();
  }, []);

  const clearSearch = useCallback(() => {
    setDraftQuery('');
    setCommittedQuery('');
  }, []);

  const removeChip = useCallback((chipId: string) => {
    const [group, value] = chipId.split(':');

    setFilters((current) => {
      if (group === 'duration') {
        return { ...current, minMinutes: null, maxMinutes: null };
      }
      if (group === 'modes') {
        return { ...current, modes: current.modes.filter((entry) => entry !== value) };
      }

      const key = group as keyof LibraryFilters;
      const list = current[key];
      if (!Array.isArray(list)) return current;

      return { ...current, [key]: list.filter((entry) => entry !== value) };
    });
  }, []);

  const openSoundscape = useCallback(
    (soundscape: Soundscape) => router.push(`/soundscape/${soundscape.id}` as Href),
    [router]
  );

  const renderRow = useCallback(
    ({ item }: { item: Soundscape }) => (
      <SoundscapeRow
        isFavourite={favouriteIds.has(item.id)}
        onPlay={(picked) => void playSoundscape(picked, { queue: results })}
        onPress={openSoundscape}
        onToggleFavourite={toggleFavourite}
        showFavourite
        soundscape={item}
      />
    ),
    [favouriteIds, openSoundscape, playSoundscape, results, toggleFavourite]
  );

  const countLabel = isLoading
    ? 'Searching…'
    : `${totalCount} ${totalCount === 1 ? 'soundscape' : 'soundscapes'}`;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.heading}>Library</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Ionicons color={HalcyonColors.textSecondary} name="search-outline" size={18} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={() => setIsFocused(false)}
              onChangeText={setDraftQuery}
              onFocus={() => setIsFocused(true)}
              onSubmitEditing={() => commitSearch(draftQuery)}
              placeholder="Search soundscapes, places, moods…"
              placeholderTextColor={HalcyonColors.textSecondary}
              ref={inputRef}
              returnKeyType="search"
              style={styles.searchInput}
              value={draftQuery}
            />
            {!!draftQuery && (
              <Pressable
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                hitSlop={10}
                onPress={clearSearch}>
                <Ionicons color={HalcyonColors.textSecondary} name="close-circle" size={17} />
              </Pressable>
            )}
          </View>

          {showSuggestions && (
            <View style={styles.suggestions}>
              {suggestions.isFetching && !suggestions.data ? (
                <View style={styles.suggestionLoading}>
                  <ActivityIndicator color={HalcyonColors.accent} size="small" />
                </View>
              ) : (suggestions.data ?? []).length === 0 ? (
                <Text style={styles.suggestionEmpty}>No matches yet.</Text>
              ) : (
                (suggestions.data ?? []).map((suggestion) => (
                  <Pressable
                    accessibilityLabel={suggestion.title}
                    accessibilityRole="button"
                    key={suggestion.id}
                    onPress={() => commitSearch(suggestion.title)}
                    style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}>
                    <Ionicons
                      color={HalcyonColors.textSecondary}
                      name="search-outline"
                      size={15}
                    />
                    <View style={styles.suggestionCopy}>
                      <Text numberOfLines={1} style={styles.suggestionTitle}>
                        {suggestion.title}
                      </Text>
                      {!!suggestion.subcategory && (
                        <Text numberOfLines={1} style={styles.suggestionMeta}>
                          {suggestion.subcategory}
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      color={HalcyonColors.textSecondary}
                      name="arrow-up-outline"
                      size={14}
                      style={styles.suggestionArrow}
                    />
                  </Pressable>
                ))
              )}
            </View>
          )}
        </View>

        {/* Filters + sort */}
        <View style={styles.controlsRow}>
          <ScrollView
            contentContainerStyle={styles.controlsContent}
            horizontal
            showsHorizontalScrollIndicator={false}>
            <Pressable
              accessibilityLabel="Open filters"
              accessibilityRole="button"
              onPress={() => setFilterSheetVisible(true)}
              style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}>
              <Ionicons color={HalcyonColors.textPrimary} name="options-outline" size={16} />
              <Text style={styles.filterLabel}>Filters</Text>
              {activeCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeLabel}>{activeCount}</Text>
                </View>
              )}
            </Pressable>

            {activeChips.map((chip) => (
              <FilterChip
                isExclusion={chip.group === 'avoids'}
                key={chip.id}
                label={chip.label}
                onRemove={() => removeChip(chip.id)}
                selected
              />
            ))}
          </ScrollView>

          <Pressable
            accessibilityLabel={`Sort by ${getSortLabel(sort)}`}
            accessibilityRole="button"
            onPress={() => setSortSheetVisible(true)}
            style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}>
            <Text numberOfLines={1} style={styles.sortLabel}>
              {getSortLabel(sort)}
            </Text>
            <Ionicons color={HalcyonColors.textSecondary} name="chevron-down" size={14} />
          </Pressable>
        </View>

        <View style={styles.countRow}>
          <Text style={styles.count}>{countLabel}</Text>
          {isFetching && !isLoading && (
            <ActivityIndicator color={HalcyonColors.accent} size="small" />
          )}
        </View>

        {isLoading ? (
          <SoundscapeRowSkeletonList />
        ) : isError && results.length === 0 ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : results.length === 0 ? (
          /* L-06 — never a dead end. */
          <ScrollView contentContainerStyle={{ paddingBottom: bottomInset }}>
            <EmptyState
              actionLabel="Request a Soundscape"
              icon="search-outline"
              message={
                isSearching
                  ? `Nothing matches “${committedQuery}”${hasActiveFilters ? ' with these filters' : ''}.`
                  : 'No soundscapes match these filters.'
              }
              onAction={() =>
                router.push(
                  committedQuery.trim()
                    ? (`/profile/request-soundscape?query=${encodeURIComponent(committedQuery.trim())}` as Href)
                    : ('/profile/request-soundscape' as Href)
                )
              }
              title="No soundscapes match"
            />

            {hasActiveFilters && (
              <View style={styles.rescueBlock}>
                <Text style={styles.rescueTitle}>Try removing a filter</Text>
                <View style={styles.rescueChips}>
                  {activeChips.map((chip) => (
                    <FilterChip
                      isExclusion={chip.group === 'avoids'}
                      key={chip.id}
                      label={chip.label}
                      onRemove={() => removeChip(chip.id)}
                      selected
                    />
                  ))}
                </View>
                <Pressable
                  accessibilityLabel="Clear all filters"
                  accessibilityRole="button"
                  onPress={() => setFilters(EMPTY_FILTERS)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <Text style={styles.rescueAction}>Clear all filters</Text>
                </Pressable>
              </View>
            )}

            {isSearching && (
              <View style={styles.rescueBlock}>
                <Text style={styles.rescueTitle}>Related searches</Text>
                <View style={styles.rescueChips}>
                  {relatedSearches(committedQuery).map((term) => (
                    <FilterChip key={term} label={term} onPress={() => commitSearch(term)} />
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          <FlatList
            contentContainerStyle={{ paddingBottom: bottomInset }}
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={renderRow}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      <FilterSheet
        filters={filters}
        onApply={setFilters}
        onClose={() => setFilterSheetVisible(false)}
        sort={sort}
        visible={filterSheetVisible}
      />

      <SortSheet
        onClose={() => setSortSheetVisible(false)}
        onSelect={setSort}
        value={sort}
        visible={sortSheetVisible}
      />

    </View>
  );
}

/**
 * Broadens a failed query by dropping the most specific word, so the row always
 * offers something to tap. There is no related-terms endpoint to call.
 */
function relatedSearches(query: string): string[] {
  const words = query.trim().split(/\s+/).filter(Boolean);
  const suggestions = new Set<string>();

  if (words.length > 1) {
    suggestions.add(words.slice(0, -1).join(' '));
    suggestions.add(words[0]);
  }

  for (const fallback of ['rain', 'ocean', 'forest', 'piano']) {
    if (suggestions.size >= 4) break;
    if (fallback !== query.trim().toLowerCase()) suggestions.add(fallback);
  }

  return [...suggestions];
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 12,
  },
  heading: {
    ...Typography.screenHeading,
  },
  pressed: {
    opacity: 0.74,
  },
  searchWrapper: {
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 14,
    zIndex: 20,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.pill,
    borderWidth: 1,
    columnGap: 10,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
    padding: 0,
  },
  suggestions: {
    backgroundColor: HalcyonColors.surfaceRaised,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  suggestionLoading: {
    paddingVertical: 22,
  },
  suggestionEmpty: {
    ...Typography.muted,
    padding: 16,
  },
  suggestionRow: {
    alignItems: 'center',
    borderTopColor: HalcyonColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    columnGap: 10,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionCopy: {
    flex: 1,
  },
  suggestionTitle: {
    ...Typography.body,
  },
  suggestionMeta: {
    ...Typography.muted,
    marginTop: 1,
  },
  suggestionArrow: {
    transform: [{ rotate: '-45deg' }],
  },
  controlsRow: {
    alignItems: 'center',
    columnGap: 10,
    flexDirection: 'row',
    paddingRight: HalcyonSpacing.screenX,
    paddingTop: 14,
  },
  controlsContent: {
    columnGap: 8,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  filterButton: {
    alignItems: 'center',
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.pill,
    borderWidth: 1,
    columnGap: 6,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  filterBadge: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 5,
  },
  filterBadgeLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  sortButton: {
    alignItems: 'center',
    columnGap: 4,
    flexDirection: 'row',
    maxWidth: 140,
  },
  sortLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  countRow: {
    alignItems: 'center',
    columnGap: 8,
    flexDirection: 'row',
    paddingBottom: 6,
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 16,
  },
  count: {
    ...Typography.muted,
  },
  rescueBlock: {
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 4,
  },
  rescueTitle: {
    ...Typography.sectionHeading,
    marginBottom: 12,
  },
  rescueChips: {
    columnGap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    rowGap: 8,
  },
  rescueAction: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    marginBottom: 22,
  },
});
