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
  | 'daily-ease-trend'
  | 'sleep-stress'
  | 'tasks-stress';

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
  breathing_usage_chart_data?: {
    count?: number;
    date?: string;
    label?: string;
    name?: string;
  }[];
  sleep_mood_chart_data?: {
    avg_stress?: number;
    date?: string;
    hours?: number;
    sleep_quality?: string;
    label?: string;
  }[];
  stress_vs_breathwork?: {
    breathwork_days_avg_stress?: number;
    insight?: string;
    no_breathwork_days_avg_stress?: number;
  };
  summary_insight?: string;
  insight?: string;
  summary?: string;
  tasks_chart_data?: {
    avg_stress?: number;
    completion_pct?: number;
    date?: string;
    insight?: string;
    label?: string;
  }[];
};

const themeColors: Record<ProgressChartType, string> = {
  'daily-ease-trend': '#28B92A',
  'sleep-stress': '#7B61FF',
  'stress-breathwork': '#FF0059',
  'tasks-stress': '#FD5728',
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
  const breathingUsageData = Array.isArray(progress.breathing_usage_chart_data)
    ? progress.breathing_usage_chart_data
    : [];
  const sleepMoodData = Array.isArray(progress.sleep_mood_chart_data)
    ? progress.sleep_mood_chart_data
    : [];
  const tasksChartData = Array.isArray(progress.tasks_chart_data)
    ? progress.tasks_chart_data
    : [];
  const breathworkStress = Number(stress?.breathwork_days_avg_stress ?? 0);
  const noBreathworkStress = Number(stress?.no_breathwork_days_avg_stress ?? 0);
  const avgStress = breathworkStress > 0 || noBreathworkStress > 0
    ? (breathworkStress + noBreathworkStress) / 2
    : 0;
  const totalBreathwork = breathingUsageData.reduce(
    (sum, item) => sum + (Number.isFinite(Number(item.count)) ? Number(item.count) : 0),
    0
  );
  const sleepData = sleepMoodData.filter((item) => Number(item.avg_stress ?? 0) > 0);
  const avgSleep = sleepData.length > 0
    ? sleepData.reduce((sum, item) => sum + (Number.isFinite(Number(item.hours)) ? Number(item.hours) : 0), 0) / sleepData.length
    : 0;
  const taskData = tasksChartData.filter((item) => Number(item.avg_stress ?? 0) > 0);
  const avgTask = taskData.length > 0
    ? taskData.reduce((sum, item) => sum + (Number.isFinite(Number(item.completion_pct)) ? Number(item.completion_pct) : 0), 0) / taskData.length
    : 0;
  const summaryText = progress.summary_insight || progress.insight || progress.summary || '';
  const stressValues = [noBreathworkStress, breathworkStress];
  const breathingValues = breathingUsageData.map((item) => Number(item.count ?? 0));
  const breathingLabels = breathingUsageData.map((item, index) =>
    item.label || item.name || dateLabel(item.date) || String(index + 1)
  );
  const sleepValues = sleepMoodData.map((item) => Number(item.avg_stress ?? 0));
  const sleepLabels = sleepMoodData.map((item, index) =>
    item.sleep_quality || item.label || dateLabel(item.date) || String(index + 1)
  );
  const taskValues = tasksChartData.map((item) => Number(item.avg_stress ?? 0));
  const taskLabels = tasksChartData.map((item, index) => {
    const completion = Number(item.completion_pct);
    return Number.isFinite(completion)
      ? `${Math.round(completion)}%`
      : item.label || dateLabel(item.date) || String(index + 1);
  });
  const stressChange = formatChange(breathworkStress, noBreathworkStress);
  const breathworkChange = formatChange(
    breathingValues[breathingValues.length - 1],
    breathingValues[breathingValues.length - 2],
    false
  );
  const sleepChange = formatChange(
    sleepValues[sleepValues.length - 1],
    sleepValues[sleepValues.length - 2]
  );
  const tasksChange = formatChange(
    taskValues[taskValues.length - 1],
    taskValues[taskValues.length - 2]
  );
  const tasksInsight = tasksChartData.find((item) => item.insight)?.insight ?? '';

  const metrics: ProgressMetric[] = [
    {
      change: stressChange,
      changeTone: toneFromChange(stressChange),
      icon: 'heart-outline',
      label: 'Avg Stress',
      themeColor: '#FF0059',
      value: formatNumber(avgStress),
    },
    {
      change: breathworkChange,
      changeTone: 'positive',
      icon: 'leaf-outline',
      label: 'Breathwork',
      themeColor: '#6339FB',
      value: formatNumber(totalBreathwork, 0),
    },
    {
      change: sleepChange,
      changeTone: toneFromChange(sleepChange),
      icon: 'moon-outline',
      label: 'Sleep',
      themeColor: '#018AFE',
      value: formatNumber(avgSleep),
    },
    {
      change: tasksChange,
      changeTone: toneFromChange(tasksChange),
      icon: 'checkmark-circle-outline',
      label: 'Tasks',
      themeColor: '#2EB668',
      value: formatNumber(avgTask, 0),
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
      data: breathingValues,
      insight: summaryText,
      labels: breathingLabels,
      stat: breathworkChange,
      subtitle: summaryText,
      themeColor: themeColors['daily-ease-trend'],
      title: 'Daily Ease Trend',
      type: 'daily-ease-trend',
    },
    {
      data: sleepValues,
      insight: '',
      labels: sleepLabels,
      stat: sleepChange,
      subtitle: 'Sleep quality compared with stress',
      themeColor: themeColors['sleep-stress'],
      title: 'Sleep Vs Stress',
      type: 'sleep-stress',
    },
    {
      data: taskValues,
      insight: tasksInsight,
      labels: taskLabels,
      stat: tasksChange,
      subtitle: tasksInsight || 'Checklist and stress patterns are tracked',
      themeColor: themeColors['tasks-stress'],
      title: 'Tasks Vs Stress',
      type: 'tasks-stress',
    },
  ];

  const chartDetails: ProgressResponse['chartDetails'] = {
    'daily-ease-trend': {
      periods: {
        Week: buildPeriod(breathingLabels, breathingValues, summaryText, [
          {
            change: breathworkChange,
            changeTone: toneFromChange(breathworkChange, false),
            icon: 'analytics-outline',
            label: 'Breathwork',
            themeColor: themeColors['daily-ease-trend'],
            value: formatNumber(totalBreathwork, 0),
          },
          {
            change: stressChange,
            changeTone: toneFromChange(stressChange),
            icon: 'heart-outline',
            label: 'Avg stress',
            themeColor: themeColors['daily-ease-trend'],
            value: formatNumber(avgStress),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'moon-outline',
            label: 'Sleep',
            themeColor: themeColors['daily-ease-trend'],
            value: formatNumber(avgSleep),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'checkmark-circle-outline',
            label: 'Tasks',
            themeColor: themeColors['daily-ease-trend'],
            value: formatNumber(avgTask, 0),
          },
        ]),
      },
      subtitle: summaryText || 'Daily ease trend',
      themeColor: themeColors['daily-ease-trend'],
      title: 'Daily Ease Trend',
      type: 'daily-ease-trend',
    },
    'sleep-stress': {
      periods: {
        Week: buildPeriod(
          sleepLabels,
          sleepValues,
          'Sleep quality compared with stress',
          [
            {
              change: sleepChange,
              changeTone: toneFromChange(sleepChange),
              icon: 'moon-outline',
              label: 'Sleep',
              themeColor: themeColors['sleep-stress'],
              value: formatNumber(avgSleep),
            },
            {
              change: '',
              changeTone: 'positive',
              icon: 'list-outline',
              label: 'Groups',
              themeColor: themeColors['sleep-stress'],
              value: formatNumber(sleepMoodData.length, 0),
            },
            {
              change: '',
              changeTone: 'positive',
              icon: 'leaf-outline',
              label: 'Breathwork',
              themeColor: themeColors['sleep-stress'],
              value: formatNumber(totalBreathwork, 0),
            },
            {
              change: '',
              changeTone: 'positive',
              icon: 'heart-outline',
              label: 'Avg stress',
              themeColor: themeColors['sleep-stress'],
              value: formatNumber(average(sleepValues)),
            },
          ]
        ),
      },
      subtitle: 'Sleep quality compared with stress',
      themeColor: themeColors['sleep-stress'],
      title: 'Sleep Vs Stress',
      type: 'sleep-stress',
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
            value: formatNumber(totalBreathwork, 0),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'moon-outline',
            label: 'Sleep',
            themeColor: themeColors['stress-breathwork'],
            value: formatNumber(avgSleep),
          },
        ]),
      },
      subtitle: 'How breathwork affects your stress',
      themeColor: themeColors['stress-breathwork'],
      title: 'Stress Vs Breathwork',
      type: 'stress-breathwork',
    },
    'tasks-stress': {
      periods: {
        Week: buildPeriod(taskLabels, taskValues, tasksInsight, [
          {
            change: tasksChange,
            changeTone: toneFromChange(tasksChange),
            icon: 'checkmark-circle-outline',
            label: 'Tasks',
            themeColor: themeColors['tasks-stress'],
            value: formatNumber(avgTask, 0),
          },
          {
            change: '',
            changeTone: 'negative',
            icon: 'remove-circle-outline',
            label: 'Entries',
            themeColor: themeColors['tasks-stress'],
            value: formatNumber(tasksChartData.length, 0),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'heart-outline',
            label: 'Avg stress',
            themeColor: themeColors['tasks-stress'],
            value: formatNumber(average(taskValues)),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'leaf-outline',
            label: 'Breathwork',
            themeColor: themeColors['tasks-stress'],
            value: formatNumber(totalBreathwork, 0),
          },
        ]),
      },
      subtitle: 'How task completion relates to stress',
      themeColor: themeColors['tasks-stress'],
      title: 'Tasks Vs Stress',
      type: 'tasks-stress',
    },
  };

  return {
    chartDetails,
    charts,
    metrics,
    summary: summaryText,
  };
}

export async function getProgress() {
  const token = await getStoredAccessToken();

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
