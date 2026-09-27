import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_PRESS_LOCK_MS = 1000;

/**
 * Blocks rapid repeat taps while a navigation transition or submit action starts.
 * The ref is updated synchronously, so even two taps in the same render frame
 * can only invoke the action once.
 */
export function useSinglePress(onPress?: () => void, lockMs = DEFAULT_PRESS_LOCK_MS) {
  const lockedRef = useRef(false);
  const onPressRef = useRef(onPress);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  onPressRef.current = onPress;

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return useCallback(() => {
    if (lockedRef.current || !onPressRef.current) return;

    lockedRef.current = true;
    timeoutRef.current = setTimeout(() => {
      lockedRef.current = false;
      timeoutRef.current = null;
    }, lockMs);

    onPressRef.current();
  }, [lockMs]);
}
