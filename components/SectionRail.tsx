import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { ReactNode } from 'react';

import { PassageColors, PassageRadius, PassageSpacing, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

const SKELETON_COUNT = 3;

type SectionRailProps<T> = {
  title: string;
  data: T[] | undefined;
  renderItem: (item: T, index: number, width?: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  isError?: boolean;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  /** 'grid' wraps the same cards instead of scrolling them sideways. */
  layout?: 'rail' | 'grid';
  /** Skeleton footprint; defaults to the square soundscape card. */
  itemWidth?: number;
  itemHeight?: number;
  withCaptionSkeleton?: boolean;
  /**
   * Shown instead of hiding the rail when the request succeeded with no rows.
   * Left undefined, an empty rail renders nothing at all.
   */
  emptyTitle?: string;
  emptyNote?: string;
  /** Caption under the items, e.g. what is not available without a connection. */
  note?: string;
};

export function SectionRail<T>({
  title,
  data,
  renderItem,
  keyExtractor,
  isLoading,
  isError,
  onSeeAll,
  seeAllLabel = 'See all',
  layout = 'rail',
  itemWidth = 132,
  itemHeight = 132,
  withCaptionSkeleton = true,
  emptyTitle,
  emptyNote,
  note,
}: SectionRailProps<T>) {
  const items = data ?? [];
  const { width: screenWidth } = useWindowDimensions();
  
  // Calculate dynamic card width for grid layout - always use 2 columns to fill width
  const gridItemWidth = layout === 'grid'
    ? (screenWidth - PassageSpacing.screenX * 2 - 14) / 2
    : itemWidth;
  
  // A refetch that failed while cached rows are on screen is not worth a
  // message: the rail is still usable, which is the whole point of the
  // persisted cache. The note is for a rail that has nothing to show.
  const hasFailed = !!isError && items.length === 0;
  const isEmpty = !isLoading && !hasFailed && items.length === 0;

  // A brand new user, or a near empty catalogue, simply drops the rail.
  if (isEmpty && !emptyTitle && !emptyNote) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {!!onSeeAll && !isEmpty && !hasFailed && (
          <Pressable
            accessibilityLabel={`${seeAllLabel} ${title}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onSeeAll}
            style={({ pressed }) => [styles.seeAllButton, pressed && styles.seeAllPressed]}>
            <Text style={styles.seeAll}>{seeAllLabel}</Text>
            <Ionicons 
              color={PassageColors.accent}
              name={seeAllLabel === 'Show less' ? 'chevron-down' : 'chevron-forward'} 
              size={14} 
            />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.row}>
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <View key={`skeleton-${index}`} style={{ width: itemWidth }}>
              <View style={[styles.skeletonBlock, { height: itemHeight, width: itemWidth }]} />
              {withCaptionSkeleton && (
                <>
                  <View style={[styles.skeletonLine, styles.skeletonTitle]} />
                  <View style={[styles.skeletonLine, styles.skeletonMeta]} />
                </>
              )}
            </View>
          ))}
        </View>
      ) : hasFailed ? (
        <Text style={styles.note}>Couldn&apos;t load this section. Pull to refresh.</Text>
      ) : isEmpty ? (
        <View>
          {!!emptyTitle && <Text style={styles.emptyTitle}>{emptyTitle}</Text>}
          {!!emptyNote && (
            <Text style={[styles.note, emptyTitle && styles.emptyNote]}>{emptyNote}</Text>
          )}
        </View>
      ) : layout === 'grid' ? (
        <View style={styles.grid}>
          {items.map((item, index) => (
            <View key={keyExtractor(item, index)} style={{ width: gridItemWidth }}>
              {renderItem(item, index, gridItemWidth)}
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.rowContent}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {items.map((item, index) => (
            <View key={keyExtractor(item, index)}>{renderItem(item, index, itemWidth)}</View>
          ))}
        </ScrollView>
      )}

      {!!note && !isLoading && !hasFailed && <Text style={styles.note}>{note}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: PassageSpacing.section,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: PassageSpacing.screenX,
  },
  title: {
    ...Typography.sectionHeading,
    flex: 1,
    paddingRight: 12,
  },
  seeAllButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  seeAll: {
    color: PassageColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  seeAllPressed: {
    opacity: 0.7,
  },
  rowContent: {
    columnGap: 14,
    paddingHorizontal: PassageSpacing.screenX,
  },
  row: {
    columnGap: 14,
    flexDirection: 'row',
    paddingHorizontal: PassageSpacing.screenX,
  },
  grid: {
    columnGap: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PassageSpacing.screenX,
    rowGap: 18,
  },
  skeletonBlock: {
    backgroundColor: PassageColors.skeleton,
    borderRadius: PassageRadius.artwork,
  },
  skeletonLine: {
    backgroundColor: PassageColors.skeleton,
    borderRadius: 4,
    height: 10,
  },
  skeletonTitle: {
    marginTop: 12,
    width: '78%',
  },
  skeletonMeta: {
    marginTop: 6,
    width: '46%',
  },
  note: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: PassageSpacing.screenX,
  },
  emptyTitle: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    paddingHorizontal: PassageSpacing.screenX,
  },
  emptyNote: {
    marginTop: 3,
  },
});
