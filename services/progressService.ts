import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMOTE_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://18.171.253.186';
const API_BASE_URL = Platform.OS === 'web' ? '/api-proxy' : REMOTE_API_BASE_URL;
const TOKEN_KEY = 'access_token';

export class ProgressAuthError extends Error {
  constructor(message = 'Session expired. Please login again.') {
    super(message);
    this.name = 'ProgressAuthError';
  }
}

export type ProgressChartType =
  | 'stress-breathwork'
  | 'movement-stress'
  | 'sleep-mood'
  | 'temperature-stress';

export type ProgressPeriod = 'Day' | 'Week' | 'Month' | 'Year';

export type ProgressMetric = {
  change: string;
  changeTone: 'positive' | 'negative';
  icon?: string;
  label: string;
  themeColor: string;
  value: string;
};

export type ProgressChartOverview = {
  data: number[];
  insight: string;
  labels: string[];
  stat: string;
  subtitle: string;
  themeColor: string;
  title: string;
  type: ProgressChartType;
};

export type ProgressChartDetailPeriod = {
  chartData: number[];
  dateRanges: string[];
  insightMessage: string;
  labels: string[];
  metricCards: ProgressMetric[];
  selectedDateRange: string;
};

export type ProgressChartDetail = {
  periods: Partial<Record<ProgressPeriod, ProgressChartDetailPeriod>>;
  subtitle: string;
  themeColor: string;
  title: string;
  type: ProgressChartType;
};

export type ProgressResponse = {
  chartDetails: Partial<Record<ProgressChartType, ProgressChartDetail>>;
  charts: ProgressChartOverview[];
  metrics: ProgressMetric[];
  summary: string;
};

type UnknownRecord = Record<string, unknown>;

type ApiProgressPayload = {
  breathing_usage?: UnknownRecord;
  daily_ease_trend?: {
    daily_ease?: number;
    date?: string;
    stress_level?: number;
  }[];
  mood_frequency?: UnknownRecord;
  sleep_vs_stress?: {
    avg_stress?: number;
    sleep_quality?: string;
  }[];
  soundscape_usage_count?: number;
  stress_vs_breathwork?: {
    breathwork_days_avg_stress?: number;
    insight?: string;
    no_breathwork_days_avg_stress?: number;
  };
  summary_insight?: string;
  tasks_vs_stress?: {
    high_completion_avg_stress?: number;
    insight?: string;
    low_completion_avg_stress?: number;
  };
};

const themeColors: Record<ProgressChartType, string> = {
  'movement-stress': '#28B92A',
  'sleep-mood': '#7B61FF',
  'stress-breathwork': '#FF0059',
  'temperature-stress': '#FD5728',
};

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function getWebToken() {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  const storage = (globalThis as unknown as { localStorage?: Storage }).localStorage;
  return storage?.getItem(TOKEN_KEY) ?? null;
}

async function getStoredAccessToken() {
  if (Platform.OS === 'web') {
    return getWebToken();
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearProgressAccessToken() {
  if (Platform.OS === 'web') {
    const storage = typeof globalThis !== 'undefined'
      ? (globalThis as unknown as { localStorage?: Storage }).localStorage
      : undefined;
    storage?.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

function getShortTokenLog(token: string | null | undefined) {
  return token ? `${token.slice(0, 10)}...` : 'missing';
}

function unwrapProgressResponse(response: unknown): ApiProgressPayload {
  if (!isRecord(response)) {
    return {};
  }

  const data = response.data;

  if (isRecord(data) && isRecord(data.progress)) {
    return data.progress as ApiProgressPayload;
  }

  if (isRecord(response.progress)) {
    return response.progress as ApiProgressPayload;
  }

  return {};
}

function compactNumbers(values: (number | undefined)[]) {
  return values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

function average(values: number[]) {
  if (!values.length) {
    return undefined;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function sumRecordValues(record: UnknownRecord | undefined) {
  if (!record) {
    return undefined;
  }

  const values = Object.values(record)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  return values.length ? values.reduce((total, value) => total + value, 0) : undefined;
}

function formatNumber(value: number | undefined, digits = 1, fallback = '0') {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

function formatChange(current: number | undefined, previous: number | undefined, lowerIsPositive = true) {
  if (typeof current !== 'number' || typeof previous !== 'number' || previous === 0) {
    return '';
  }

  const percentage = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(percentage);
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

function toneFromChange(change: string, lowerIsPositive = true): 'positive' | 'negative' {
  const numeric = Number(change.replace('%', ''));

  if (!Number.isFinite(numeric)) {
    return 'positive';
  }

  return lowerIsPositive ? (numeric <= 0 ? 'positive' : 'negative') : numeric >= 0 ? 'positive' : 'negative';
}

function dateLabel(date: string | undefined) {
  if (!date) {
    return '';
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-US', { weekday: 'short' });
}

function buildPeriod(
  labels: string[],
  chartData: number[],
  insightMessage: string,
  metricCards: ProgressMetric[],
  selectedDateRange = 'Latest'
): ProgressChartDetailPeriod {
  return {
    chartData,
    dateRanges: selectedDateRange ? [selectedDateRange] : [],
    insightMessage,
    labels,
    metricCards,
    selectedDateRange,
  };
}

function mapProgress(progress: ApiProgressPayload): ProgressResponse {
  const stress = progress.stress_vs_breathwork;
  const sleep = progress.sleep_vs_stress ?? [];
  const tasks = progress.tasks_vs_stress;
  const dailyTrend = progress.daily_ease_trend ?? [];
  const breathingUsage = sumRecordValues(progress.breathing_usage);
  const moodFrequency = progress.mood_frequency;
  const moodTotal = sumRecordValues(moodFrequency);
  const soundscapeCount = progress.soundscape_usage_count;
  const latestTrend = dailyTrend[dailyTrend.length - 1];
  const previousTrend = dailyTrend[dailyTrend.length - 2];
  const avgSleepStress = average(compactNumbers(sleep.map((item) => item.avg_stress)));
  const avgDailyEase = average(compactNumbers(dailyTrend.map((item) => item.daily_ease)));
  const stressValues = compactNumbers([
    stress?.no_breathwork_days_avg_stress,
    stress?.breathwork_days_avg_stress,
  ]);
  const taskValues = compactNumbers([
    tasks?.low_completion_avg_stress,
    tasks?.high_completion_avg_stress,
  ]);
  const trendEaseValues = compactNumbers(dailyTrend.map((item) => item.daily_ease));
  const trendLabels = dailyTrend.map((item) => dateLabel(item.date)).filter(Boolean);
  const stressChange = formatChange(
    stress?.breathwork_days_avg_stress,
    stress?.no_breathwork_days_avg_stress
  );
  const tasksChange = formatChange(
    tasks?.high_completion_avg_stress,
    tasks?.low_completion_avg_stress
  );
  const easeChange = formatChange(latestTrend?.daily_ease, previousTrend?.daily_ease, false);

  const metrics: ProgressMetric[] = [
    {
      change: formatChange(latestTrend?.stress_level, previousTrend?.stress_level),
      changeTone: toneFromChange(formatChange(latestTrend?.stress_level, previousTrend?.stress_level)),
      icon: 'heart-outline',
      label: 'Heart Rate',
      themeColor: '#FF0059',
      value: formatNumber(latestTrend?.stress_level),
    },
    {
      change: '',
      changeTone: 'positive',
      icon: 'leaf-outline',
      label: 'Breathwork',
      themeColor: '#6339FB',
      value: formatNumber(breathingUsage, 0),
    },
    {
      change: '',
      changeTone: 'positive',
      icon: 'moon-outline',
      label: 'Sleep Score',
      themeColor: '#018AFE',
      value: formatNumber(avgSleepStress),
    },
    {
      change: tasksChange,
      changeTone: toneFromChange(tasksChange),
      icon: 'checkmark-circle-outline',
      label: 'Tasks',
      themeColor: '#2EB668',
      value: formatNumber(tasks?.high_completion_avg_stress),
    },
  ];

  const charts: ProgressChartOverview[] = [
    {
      data: stressValues,
      insight: stress?.insight ?? '',
      labels: ['No breathwork', 'Breathwork'],
      stat: stressChange,
      subtitle: stress?.insight ?? '',
      themeColor: themeColors['stress-breathwork'],
      title: 'Stress Vs Breathwork',
      type: 'stress-breathwork',
    },
    {
      data: trendEaseValues,
      insight: progress.summary_insight ?? '',
      labels: trendLabels,
      stat: easeChange,
      subtitle: progress.summary_insight ?? '',
      themeColor: themeColors['movement-stress'],
      title: 'Daily Ease Trend',
      type: 'movement-stress',
    },
    {
      data: compactNumbers(sleep.map((item) => item.avg_stress)),
      insight: '',
      labels: sleep.map((item) => item.sleep_quality ?? '').filter(Boolean),
      stat: '',
      subtitle: 'Sleep quality compared with stress',
      themeColor: themeColors['sleep-mood'],
      title: 'Sleep Vs Stress',
      type: 'sleep-mood',
    },
    {
      data: taskValues,
      insight: tasks?.insight ?? '',
      labels: ['Low completion', 'High completion'],
      stat: tasksChange,
      subtitle: tasks?.insight ?? '',
      themeColor: themeColors['temperature-stress'],
      title: 'Tasks Vs Stress',
      type: 'temperature-stress',
    },
  ];

  const chartDetails: ProgressResponse['chartDetails'] = {
    'movement-stress': {
      periods: {
        Week: buildPeriod(trendLabels, trendEaseValues, progress.summary_insight ?? '', [
          {
            change: easeChange,
            changeTone: toneFromChange(easeChange, false),
            icon: 'analytics-outline',
            label: 'Daily ease',
            themeColor: themeColors['movement-stress'],
            value: formatNumber(avgDailyEase),
          },
          {
            change: formatChange(latestTrend?.stress_level, previousTrend?.stress_level),
            changeTone: toneFromChange(formatChange(latestTrend?.stress_level, previousTrend?.stress_level)),
            icon: 'heart-outline',
            label: 'Stress',
            themeColor: themeColors['movement-stress'],
            value: formatNumber(latestTrend?.stress_level),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'happy-outline',
            label: 'Mood logs',
            themeColor: themeColors['movement-stress'],
            value: formatNumber(moodTotal, 0),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'musical-notes-outline',
            label: 'Soundscapes',
            themeColor: themeColors['movement-stress'],
            value: formatNumber(soundscapeCount, 0),
          },
        ]),
      },
      subtitle: 'Daily ease and stress trend',
      themeColor: themeColors['movement-stress'],
      title: 'Daily Ease Trend',
      type: 'movement-stress',
    },
    'sleep-mood': {
      periods: {
        Week: buildPeriod(
          sleep.map((item) => item.sleep_quality ?? '').filter(Boolean),
          compactNumbers(sleep.map((item) => item.avg_stress)),
          'Sleep quality compared with stress',
          [
            {
              change: '',
              changeTone: 'positive',
              icon: 'moon-outline',
              label: 'Avg stress',
              themeColor: themeColors['sleep-mood'],
              value: formatNumber(avgSleepStress),
            },
            {
              change: '',
              changeTone: 'positive',
              icon: 'list-outline',
              label: 'Sleep groups',
              themeColor: themeColors['sleep-mood'],
              value: formatNumber(sleep.length, 0),
            },
            {
              change: '',
              changeTone: 'positive',
              icon: 'leaf-outline',
              label: 'Breathwork',
              themeColor: themeColors['sleep-mood'],
              value: formatNumber(breathingUsage, 0),
            },
            {
              change: '',
              changeTone: 'positive',
              icon: 'musical-notes-outline',
              label: 'Soundscapes',
              themeColor: themeColors['sleep-mood'],
              value: formatNumber(soundscapeCount, 0),
            },
          ]
        ),
      },
      subtitle: 'Sleep quality compared with stress',
      themeColor: themeColors['sleep-mood'],
      title: 'Sleep Vs Stress',
      type: 'sleep-mood',
    },
    'stress-breathwork': {
      periods: {
        Week: buildPeriod(['No breathwork', 'Breathwork'], stressValues, stress?.insight ?? '', [
          {
            change: stressChange,
            changeTone: toneFromChange(stressChange),
            icon: 'heart-outline',
            label: 'With breathwork',
            themeColor: themeColors['stress-breathwork'],
            value: formatNumber(stress?.breathwork_days_avg_stress),
          },
          {
            change: '',
            changeTone: 'negative',
            icon: 'heart-dislike-outline',
            label: 'No breathwork',
            themeColor: themeColors['stress-breathwork'],
            value: formatNumber(stress?.no_breathwork_days_avg_stress),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'leaf-outline',
            label: 'Breathwork',
            themeColor: themeColors['stress-breathwork'],
            value: formatNumber(breathingUsage, 0),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'musical-notes-outline',
            label: 'Soundscapes',
            themeColor: themeColors['stress-breathwork'],
            value: formatNumber(soundscapeCount, 0),
          },
        ]),
      },
      subtitle: 'How breathwork affects your stress',
      themeColor: themeColors['stress-breathwork'],
      title: 'Stress Vs Breathwork',
      type: 'stress-breathwork',
    },
    'temperature-stress': {
      periods: {
        Week: buildPeriod(['Low completion', 'High completion'], taskValues, tasks?.insight ?? '', [
          {
            change: tasksChange,
            changeTone: toneFromChange(tasksChange),
            icon: 'checkmark-circle-outline',
            label: 'High tasks',
            themeColor: themeColors['temperature-stress'],
            value: formatNumber(tasks?.high_completion_avg_stress),
          },
          {
            change: '',
            changeTone: 'negative',
            icon: 'remove-circle-outline',
            label: 'Low tasks',
            themeColor: themeColors['temperature-stress'],
            value: formatNumber(tasks?.low_completion_avg_stress),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'happy-outline',
            label: 'Mood logs',
            themeColor: themeColors['temperature-stress'],
            value: formatNumber(moodTotal, 0),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'analytics-outline',
            label: 'Daily ease',
            themeColor: themeColors['temperature-stress'],
            value: formatNumber(avgDailyEase),
          },
        ]),
      },
      subtitle: 'How task completion relates to stress',
      themeColor: themeColors['temperature-stress'],
      title: 'Tasks Vs Stress',
      type: 'temperature-stress',
    },
  };

  return {
    chartDetails,
    charts,
    metrics,
    summary: progress.summary_insight ?? '',
  };
}

export async function getProgress() {
  const token = await getStoredAccessToken();

  console.log('Progress token exists:', Boolean(token), getShortTokenLog(token));

  if (!token) {
    throw new ProgressAuthError();
  }

  const response = await fetch(`${API_BASE_URL}/api/progress`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });
  const data = await response.json();

  if (response.status === 401) {
    await clearProgressAccessToken();
    throw new ProgressAuthError();
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error ?? data?.message ?? 'Unable to load progress.');
  }

  return mapProgress(unwrapProgressResponse(data));
}
