import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PassageColors, PassageRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

const NOTICE_MS = 2600;

/**
 * Small transient message pinned above the bottom of a screen — used for
 * actions that acknowledge but have nowhere to go yet, and for failures that do
 * not deserve a blocking alert.
 */
export function useToast() {
  const [notice, setNotice] = useState<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    []
  );

  const showToast = useCallback((message: string) => {
    setNotice(message);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  return { notice, showToast };
}

export function Toast({ notice, bottom }: { notice: string | null; bottom: number }) {
  if (!notice) return null;

  return (
    <View pointerEvents="none" style={[styles.wrapper, { bottom }]}>
      <View style={styles.pill}>
        <Text numberOfLines={1} style={styles.text}>
          {notice}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  pill: {
    backgroundColor: PassageColors.surfaceRaised,
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.pill,
    borderWidth: 1,
    maxWidth: '86%',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  text: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
});
