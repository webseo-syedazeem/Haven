import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { checklistTasks, getChecklistStatusMap, type ChecklistTask } from '@/constants/checklistTasks';
import { useDailyEase } from '@/contexts/DailyEaseContext';
import { getTodayChecklist, toggleChecklistTask } from '@/services/checklistService';

const CHECKLIST_CACHE_KEY = 'haven.checklist.today';

export type ChecklistTaskState = ChecklistTask & {
  completed: boolean;
};

type ChecklistContextValue = {
  completedCount: number;
  error: string;
  lastChecklistDate: string;
  loading: boolean;
  refreshTodayChecklist: () => Promise<void>;
  savingTaskName: string | null;
  todayTasks: ChecklistTaskState[];
  toggleTask: (taskName: string) => Promise<void>;
  totalTasks: number;
};

const ChecklistContext = createContext<ChecklistContextValue | null>(null);

type ChecklistCache = {
  date: string;
  tasks: {
    completed: boolean;
    name: string;
  }[];
};

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getChecklistDate(checklist: unknown) {
  if (!checklist || typeof checklist !== 'object') {
    return getLocalDateKey();
  }

  const value = (checklist as Record<string, unknown>).date;
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 10) : getLocalDateKey();
}

function getWebStorage() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage
    : undefined;
}

async function getStoredChecklistCache() {
  const text =
    Platform.OS === 'web'
      ? getWebStorage()?.getItem(CHECKLIST_CACHE_KEY)
      : await SecureStore.getItemAsync(CHECKLIST_CACHE_KEY);

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as ChecklistCache;
  } catch {
    await clearStoredChecklistCache();
    return null;
  }
}

async function setStoredChecklistCache(cache: ChecklistCache) {
  const text = JSON.stringify(cache);

  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(CHECKLIST_CACHE_KEY, text);
    return;
  }

  await SecureStore.setItemAsync(CHECKLIST_CACHE_KEY, text);
}

async function clearStoredChecklistCache() {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(CHECKLIST_CACHE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(CHECKLIST_CACHE_KEY);
}

function hasUsableChecklistStatuses(checklist: unknown) {
  if (!checklist || typeof checklist !== 'object') {
    return false;
  }

  const record = checklist as Record<string, unknown>;
  const tasks = record.tasks ?? record.checklist_tasks ?? record.items;

  if (Array.isArray(tasks) && tasks.length > 0) {
    return tasks.some((task) => {
      if (!task || typeof task !== 'object') {
        return false;
      }

      const value = task as Record<string, unknown>;
      return (
        typeof value.completed === 'boolean' ||
        typeof value.is_completed === 'boolean' ||
        typeof value.checked === 'boolean' ||
        typeof value.done === 'boolean'
      );
    });
  }

  return checklistTasks.some((task) => typeof record[task.apiName] === 'boolean' || typeof record[task.id] === 'boolean');
}

function buildTaskState(checklist: unknown): ChecklistTaskState[] {
  const statusMap = getChecklistStatusMap(checklist);

  return checklistTasks.map((task) => ({
    ...task,
    completed: Boolean(statusMap[task.apiName]),
  }));
}

function buildEmptyTaskState(): ChecklistTaskState[] {
  return checklistTasks.map((task) => ({
    ...task,
    completed: false,
  }));
}

function buildTaskStateFromCache(cache: ChecklistCache): ChecklistTaskState[] {
  const statusMap = new Map(cache.tasks.map((task) => [task.name, task.completed]));

  return checklistTasks.map((task) => ({
    ...task,
    completed: Boolean(statusMap.get(task.apiName)),
  }));
}

function createCache(date: string, tasks: ChecklistTaskState[]): ChecklistCache {
  return {
    date,
    tasks: tasks.map((task) => ({
      completed: task.completed,
      name: task.apiName,
    })),
  };
}

function cacheHasCompletedTask(cache: ChecklistCache | null) {
  return Boolean(cache?.tasks.some((task) => task.completed));
}

function tasksHaveCompletedTask(tasks: ChecklistTaskState[]) {
  return tasks.some((task) => task.completed);
}

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const { refreshDailyEase } = useDailyEase();
  const [error, setError] = useState('');
  const [lastChecklistDate, setLastChecklistDate] = useState(getLocalDateKey());
  const [loading, setLoading] = useState(true);
  const [savingTaskName, setSavingTaskName] = useState<string | null>(null);
  const [todayTasks, setTodayTasks] = useState<ChecklistTaskState[]>(buildEmptyTaskState);
  const refreshInFlight = useRef<Promise<void> | null>(null);

  const refreshTodayChecklist = useCallback(async () => {
    if (refreshInFlight.current) {
      return refreshInFlight.current;
    }

    const refreshPromise = (async () => {
      setLoading(true);
      setError('');

      try {
        const checklist = await getTodayChecklist();
        const localToday = getLocalDateKey();
        const checklistDate = getChecklistDate(checklist);
        const cache = await getStoredChecklistCache();

        if (cache && cache.date !== localToday) {
          await clearStoredChecklistCache();
        }

        if (hasUsableChecklistStatuses(checklist)) {
          const nextTasks = buildTaskState(checklist);

          if (
            cache?.date === localToday &&
            cacheHasCompletedTask(cache) &&
            !tasksHaveCompletedTask(nextTasks)
          ) {
            const cachedTasks = buildTaskStateFromCache(cache);
            setTodayTasks(cachedTasks);
            setLastChecklistDate(cache.date);
            return;
          }

          setTodayTasks(nextTasks);
          setLastChecklistDate(checklistDate);
          await setStoredChecklistCache(createCache(checklistDate, nextTasks));
          return;
        }

        if (cache?.date === localToday) {
          setTodayTasks(buildTaskStateFromCache(cache));
          setLastChecklistDate(cache.date);
          return;
        }

        const emptyTasks = buildEmptyTaskState();
        setTodayTasks(emptyTasks);
        setLastChecklistDate(localToday);
      } catch (refreshError) {
        const localToday = getLocalDateKey();
        const cache = await getStoredChecklistCache();

        if (cache?.date === localToday) {
          setTodayTasks(buildTaskStateFromCache(cache));
          setLastChecklistDate(cache.date);
        } else {
          if (cache) {
            await clearStoredChecklistCache();
          }

          setTodayTasks(buildEmptyTaskState());
          setLastChecklistDate(localToday);
        }

        setError(refreshError instanceof Error ? refreshError.message : 'Unable to load checklist.');
      } finally {
        setLoading(false);
        refreshInFlight.current = null;
      }
    })();

    refreshInFlight.current = refreshPromise;
    return refreshPromise;
  }, []);

  const refreshIfDateChanged = useCallback(() => {
    if (getLocalDateKey() !== lastChecklistDate) {
      void clearStoredChecklistCache().finally(() => {
        void refreshTodayChecklist();
      });
    }
  }, [lastChecklistDate, refreshTodayChecklist]);

  useEffect(() => {
    void refreshTodayChecklist();
  }, [refreshTodayChecklist]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        refreshIfDateChanged();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refreshIfDateChanged]);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    const timeoutId = setTimeout(() => {
      void refreshTodayChecklist();
    }, nextMidnight.getTime() - now.getTime() + 1000);

    return () => clearTimeout(timeoutId);
  }, [lastChecklistDate, refreshTodayChecklist]);

  const toggleTask = useCallback(
    async (taskName: string) => {
      if (savingTaskName) {
        return;
      }

      const task = todayTasks.find((item) => item.apiName === taskName);

      if (!task) {
        return;
      }

      const nextCompleted = !task.completed;
      const previousTasks = todayTasks;

      setSavingTaskName(taskName);
      setError('');
      setTodayTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.apiName === taskName ? { ...item, completed: nextCompleted } : item
        )
      );

      try {
        const response = await toggleChecklistTask(taskName, nextCompleted);
        const optimisticTasks = previousTasks.map((item) =>
          item.apiName === taskName ? { ...item, completed: nextCompleted } : item
        );

        if (response?.checklist) {
          const nextTasks = hasUsableChecklistStatuses(response.checklist)
            ? buildTaskState(response.checklist)
            : optimisticTasks;
          const nextDate = getChecklistDate(response.checklist);

          setTodayTasks(nextTasks);
          setLastChecklistDate(nextDate);
          await setStoredChecklistCache(createCache(nextDate, nextTasks));
        } else {
          const nextDate = getLocalDateKey();

          setTodayTasks(optimisticTasks);
          setLastChecklistDate(nextDate);
          await setStoredChecklistCache(createCache(nextDate, optimisticTasks));
        }

        void refreshDailyEase();
      } catch (toggleError) {
        setTodayTasks(previousTasks);
        await setStoredChecklistCache(createCache(lastChecklistDate, previousTasks));
        setError(toggleError instanceof Error ? toggleError.message : 'Unable to update checklist.');
      } finally {
        setSavingTaskName(null);
      }
    },
    [lastChecklistDate, refreshDailyEase, savingTaskName, todayTasks]
  );

  const completedCount = todayTasks.filter((task) => task.completed).length;
  const value = useMemo(
    () => ({
      completedCount,
      error,
      lastChecklistDate,
      loading,
      refreshTodayChecklist,
      savingTaskName,
      todayTasks,
      toggleTask,
      totalTasks: todayTasks.length,
    }),
    [
      completedCount,
      error,
      lastChecklistDate,
      loading,
      refreshTodayChecklist,
      savingTaskName,
      todayTasks,
      toggleTask,
    ]
  );

  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>;
}

export function useChecklist() {
  const value = useContext(ChecklistContext);

  if (!value) {
    throw new Error('useChecklist must be used within ChecklistProvider.');
  }

  return value;
}
