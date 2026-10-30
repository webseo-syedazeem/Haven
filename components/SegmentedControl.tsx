import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PassageColors, PassageSpacing } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

export type Segment<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Gold-underlined tab strip. Scrolls horizontally so four labels still fit on a
 * narrow phone without truncating.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.content}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {segments.map((segment) => {
          const isActive = segment.value === value;

          return (
            <Pressable
              accessibilityLabel={segment.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={segment.value}
              onPress={() => onChange(segment.value)}
              style={({ pressed }) => [styles.segment, pressed && styles.segmentPressed]}>
              <Text style={[styles.label, isActive && styles.labelActive]}>{segment.label}</Text>
              <View style={[styles.underline, isActive && styles.underlineActive]} />
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.hairline} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  content: {
    columnGap: 24,
    paddingHorizontal: PassageSpacing.screenX,
  },
  segment: {
    alignItems: 'center',
    paddingTop: 4,
  },
  segmentPressed: {
    opacity: 0.7,
  },
  label: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    paddingBottom: 10,
  },
  labelActive: {
    color: PassageColors.accent,
  },
  underline: {
    backgroundColor: 'transparent',
    borderRadius: 2,
    height: 2,
    width: '100%',
  },
  underlineActive: {
    backgroundColor: PassageColors.accent,
  },
  hairline: {
    backgroundColor: PassageColors.border,
    bottom: 0,
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: -1,
  },
});
