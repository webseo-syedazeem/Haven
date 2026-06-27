import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'expo-router';

import { clearAuthTokens } from '@/lib/haven-api';
import {
  getProgress,
  ProgressAuthError,
  type ProgressChartType,
  type ProgressResponse,
} from '@/services/progressService';

type ProgressContextValue = {
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  progress: ProgressResponse | null;
  refreshProgress: () => Promise<void>;
  silentRefresh: () => Promise<void>;
  selectedChartType: ProgressChartType | null;
  setSelectedChartType: (type: ProgressChartType | null) => void;
  loadProgressIfNeeded: () => Promise<void>;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<ProgressChartType | null>(null);

  const fetchProgress = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else if (mode === 'initial') {
      setIsLoading(true);
    }

    try {
      const response = await getProgress();
      setProgress(response);
      setError(null);
    } catch (fetchError) {
      if (fetchError instanceof ProgressAuthError) {
        clearAuthTokens();
        setProgress(null);
        setError(fetchError.message);
        router.replace('/login');
      } else {
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load progress.');
      }
    } finally {
      if (mode === 'refresh') {
        setIsRefreshing(false);
      } else if (mode === 'initial') {
        setIsLoading(false);
      }
    }
  }, [router]);

  const refreshProgress = useCallback(() => fetchProgress('refresh'), [fetchProgress]);
  const silentRefresh = useCallback(() => fetchProgress('silent'), [fetchProgress]);

  const loadProgressIfNeeded = useCallback(async () => {
    if (!progress && !isLoading) {
      await fetchProgress('initial');
    }
  }, [fetchProgress, isLoading, progress]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      error,
      isLoading,
      isRefreshing,
      loadProgressIfNeeded,
      progress,
      refreshProgress,
      silentRefresh,
      selectedChartType,
      setSelectedChartType,
    }),
    [
      error,
      isLoading,
      isRefreshing,
      loadProgressIfNeeded,
      progress,
      refreshProgress,
      silentRefresh,
      selectedChartType,
    ]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error('useProgress must be used within ProgressProvider');
  }

  return context;
}
