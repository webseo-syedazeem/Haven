import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getDailyEase, type DailyEase } from '@/services/dailyEaseService';

const FALLBACK_MESSAGE = 'You are building calm,\nand consistency. Keep\ngoing!';
const FALLBACK_LABEL = 'Supported';

type DailyEaseContextValue = {
  dailyEase: DailyEase;
  error: string;
  loading: boolean;
  refreshDailyEase: () => Promise<void>;
};

const DailyEaseContext = createContext<DailyEaseContextValue | null>(null);

const fallbackDailyEase: DailyEase = {
  label: FALLBACK_LABEL,
  message: FALLBACK_MESSAGE,
  score: 0,
};

export function DailyEaseProvider({ children }: { children: ReactNode }) {
  const [dailyEase, setDailyEase] = useState<DailyEase>(fallbackDailyEase);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refreshDailyEase = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const nextDailyEase = await getDailyEase();
      setDailyEase({
        label: nextDailyEase.label || FALLBACK_LABEL,
        message: nextDailyEase.message || FALLBACK_MESSAGE,
        score: nextDailyEase.score,
      });
    } catch (refreshError) {
      setDailyEase(fallbackDailyEase);
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to load Daily Ease.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDailyEase();
  }, [refreshDailyEase]);

  const value = useMemo(
    () => ({
      dailyEase,
      error,
      loading,
      refreshDailyEase,
    }),
    [dailyEase, error, loading, refreshDailyEase]
  );

  return <DailyEaseContext.Provider value={value}>{children}</DailyEaseContext.Provider>;
}

export function useDailyEase() {
  const value = useContext(DailyEaseContext);

  if (!value) {
    throw new Error('useDailyEase must be used within DailyEaseProvider.');
  }

  return value;
}
