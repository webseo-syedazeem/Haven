import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMOTE_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://thehappyapp.co.uk';
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
  | 'tasks-stress'
  | 'breathwork-minutes'
  | 'movement-stress'
  | 'mood-frequency'
  | 'breathing-usage'
  | 'soundscape-usage'
  | 'sleep-mood';

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
  stress_vs_breathwork?: {
    breathwork_days_avg_stress?: number;
    no_breathwork_days_avg_stress?: number;
    insight?: string;
  };
  tasks_vs_stress?: {
    high_completion_avg_stress?: number;
    low_completion_avg_stress?: number;
    insight?: string;
  };
  movement_vs_stress?: {
    soundscape_days_avg_stress?: number;
    no_soundscape_days_avg_stress?: number;
    insight?: string;
  };
  breathing_usage_chart_data?: {
    type?: string;
    count?: number;
    date?: string;
    label?: string;
    name?: string;
  }[];
  sleep_mood_chart_data?: {
    hours?: number;
    avg_stress?: number;
    most_frequent_mood?: string | null;
    date?: string;
    sleep_quality?: string;
    label?: string;
  }[];
  sleep_stress_chart_data?: {
    sleep_quality?: string;
    avg_stress?: number;
  }[];
  daily_ease_vs_stress_chart_data?: {
    date?: string;
    daily_ease?: number;
    stress_level?: number;
  }[];
  tasks_chart_data?: {
    completion_pct?: number;
    avg_stress?: number;
    date?: string;
    insight?: string;
    label?: string;
  }[];
  breathwork_chart_data?: {
    minutes?: number;
    avg_stress?: number;
  }[];
  movement_chart_data?: {
    steps_label?: string;
    step_value?: number;
    avg_stress?: number;
  }[];
  mood_frequency_chart_data?: {
    mood?: string;
    count?: number;
  }[];
  soundscape_chart_data?: {
    date?: string;
    count?: number;
  }[];
  summary_insight?: string;
  insight?: string;
  summary?: string;
};

const themeColors: Record<ProgressChartType, string> = {
  'daily-ease-trend': '#28B92A',
  'sleep-stress': '#7B61FF',
  'stress-breathwork': '#FF0059',
  'tasks-stress': '#FD5728',
  'breathwork-minutes': '#6339FB',
  'movement-stress': '#018AFE',
  'mood-frequency': '#FF6B35',
  'breathing-usage': '#00BFA5',
  'soundscape-usage': '#9C27B0',
  'sleep-mood': '#3770FC',
};

const breathingTypeShortLabels: Record<string, string> = {
  'Box Breathing': 'Box',
  '4-7-8 Sleep Reset': '4-7-8',
  'Physiological Sigh': 'Sigh',
  'Resonant Breathing': 'Resonant',
  'Focus Reset': 'Focus',
  'Morning Lift': 'Morning',
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

  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function average(values: number[]) {
  if (!values.length) {
    return undefined;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
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

function mapProgress(progress: ApiProgressPayload): ProgressResponse {
  const stress = progress.stress_vs_breathwork;

  // Parse all arrays from API
  const breathingUsageData = Array.isArray(progress.breathing_usage_chart_data)
    ? progress.breathing_usage_chart_data : [];
  const sleepMoodData = Array.isArray(progress.sleep_mood_chart_data)
    ? progress.sleep_mood_chart_data : [];
  const sleepStressData = Array.isArray(progress.sleep_stress_chart_data)
    ? progress.sleep_stress_chart_data : [];
  const dailyEaseTrendData = Array.isArray(progress.daily_ease_vs_stress_chart_data)
    ? progress.daily_ease_vs_stress_chart_data : [];
  const tasksChartData = Array.isArray(progress.tasks_chart_data)
    ? progress.tasks_chart_data : [];
  const breathworkMinutesData = Array.isArray(progress.breathwork_chart_data)
    ? progress.breathwork_chart_data : [];
  const movementData = Array.isArray(progress.movement_chart_data)
    ? progress.movement_chart_data : [];
  const moodFrequencyData = Array.isArray(progress.mood_frequency_chart_data)
    ? progress.mood_frequency_chart_data : [];
  const soundscapeData = Array.isArray(progress.soundscape_chart_data)
    ? progress.soundscape_chart_data : [];

  // ─── Box 1: Avg Stress ───────────────────────────────────────────────────
  const breathworkStress = Number(stress?.breathwork_days_avg_stress ?? 0);
  const noBreathworkStress = Number(stress?.no_breathwork_days_avg_stress ?? 0);
  const avgStress = breathworkStress > 0 || noBreathworkStress > 0
    ? (breathworkStress + noBreathworkStress) / 2 : 0;

  // ─── Box 2: Breathwork sessions ──────────────────────────────────────────
  const totalBreathwork = breathingUsageData.reduce(
    (sum, item) => sum + (Number.isFinite(Number(item.count)) ? Number(item.count) : 0), 0
  );

  // ─── Box 3: Sleep ────────────────────────────────────────────────────────
  const sleepDataFiltered = sleepMoodData.filter((item) => Number(item.avg_stress ?? 0) > 0);
  const avgSleep = sleepDataFiltered.length > 0
    ? sleepDataFiltered.reduce(
        (sum, item) => sum + (Number.isFinite(Number(item.hours)) ? Number(item.hours) : 0), 0
      ) / sleepDataFiltered.length : 0;

  // ─── Box 4: Tasks ────────────────────────────────────────────────────────
  const taskDataFiltered = tasksChartData.filter((item) => Number(item.avg_stress ?? 0) > 0);
  const avgTask = taskDataFiltered.length > 0
    ? taskDataFiltered.reduce(
        (sum, item) => sum + (Number.isFinite(Number(item.completion_pct)) ? Number(item.completion_pct) : 0), 0
      ) / taskDataFiltered.length : 0;

  const summaryText = progress.summary_insight || progress.insight || progress.summary || '';

  // ─── Chart 1: Stress vs Breathwork ───────────────────────────────────────
  const stressValues = [noBreathworkStress, breathworkStress];
  const stressChange = formatChange(breathworkStress, noBreathworkStress);

  // ─── Chart 2: Daily Ease Trend ───────────────────────────────────────────
  const dailyEaseValues = dailyEaseTrendData.map((item) => Number(item.daily_ease ?? 0));
  const dailyEaseLabels = dailyEaseTrendData.map((item) => dateLabel(item.date));
  const latestDailyEase = dailyEaseValues[dailyEaseValues.length - 1];
  const prevDailyEase = dailyEaseValues[dailyEaseValues.length - 2];
  const dailyEaseChange = formatChange(latestDailyEase, prevDailyEase, false);
  const dailyEaseStat = latestDailyEase !== undefined && Number.isFinite(latestDailyEase)
    ? String(Math.round(latestDailyEase)) : '';

  // ─── Chart 3: Sleep vs Stress ────────────────────────────────────────────
  const sleepStressValues = sleepStressData.map((item) => Number(item.avg_stress ?? 0));
  const sleepStressLabels = sleepStressData.map((item) => item.sleep_quality ?? '');
  const sleepChange = formatChange(
    sleepStressValues[sleepStressValues.length - 1],
    sleepStressValues[sleepStressValues.length - 2]
  );

  // ─── Chart 4: Tasks vs Stress ────────────────────────────────────────────
  const taskValues = tasksChartData.map((item) => Number(item.avg_stress ?? 0));
  const taskLabels = tasksChartData.map((item) => {
    const completion = Number(item.completion_pct);
    return Number.isFinite(completion)
      ? `${Math.round(completion)}%`
      : item.label || String(item.completion_pct || '');
  });
  const tasksChange = formatChange(taskValues[taskValues.length - 1], taskValues[taskValues.length - 2]);
  const tasksInsight =
    progress.tasks_vs_stress?.insight ??
    tasksChartData.find((item) => item.insight)?.insight ?? '';

  // ─── Chart 5: Breathwork Minutes vs Stress ───────────────────────────────
  const breathworkMinValues = breathworkMinutesData.map((item) => Number(item.avg_stress ?? 0));
  const breathworkMinLabels = breathworkMinutesData.map((item) =>
    item.minutes !== undefined ? `${item.minutes}m` : ''
  );
  const breathworkMinChange = formatChange(
    breathworkMinValues[breathworkMinValues.length - 1],
    breathworkMinValues[breathworkMinValues.length - 2]
  );

  // ─── Chart 6: Movement (Soundscape) vs Stress ────────────────────────────
  const movementValues = movementData.map((item) => Number(item.avg_stress ?? 0));
  const movementLabels = movementData.map((item) => item.steps_label ?? '');
  const movementChange = formatChange(movementValues[movementValues.length - 1], movementValues[movementValues.length - 2]);
  const movementInsight = progress.movement_vs_stress?.insight ?? '';

  // ─── Chart 7: Mood Frequency ─────────────────────────────────────────────
  const moodFreqValues = moodFrequencyData.map((item) => Number(item.count ?? 0));
  const moodFreqLabels = moodFrequencyData.map((item) => item.mood ?? '');
  const totalMoodCount = moodFreqValues.reduce((sum, v) => sum + v, 0);

  // ─── Chart 8: Breathing Usage ────────────────────────────────────────────
  const breathingUsageValues = breathingUsageData.map((item) => Number(item.count ?? 0));
  const breathingUsageLabels = breathingUsageData.map((item) => {
    const typeName = item.type || item.label || item.name || '';
    return breathingTypeShortLabels[typeName] ?? typeName.split(' ')[0] ?? '';
  });
  const breathingUsageChange = formatChange(
    breathingUsageValues[breathingUsageValues.length - 1],
    breathingUsageValues[breathingUsageValues.length - 2],
    false
  );

  // ─── Chart 9: Soundscape Usage ───────────────────────────────────────────
  const soundscapeValues = soundscapeData.map((item) => Number(item.count ?? 0));
  const soundscapeLabels = soundscapeData.map((item) => dateLabel(item.date));
  const totalSoundscape = soundscapeValues.reduce((sum, v) => sum + v, 0);
  const soundscapeChange = formatChange(
    soundscapeValues[soundscapeValues.length - 1],
    soundscapeValues[soundscapeValues.length - 2],
    false
  );

  // ─── Chart 10: Sleep Hours vs Stress ─────────────────────────────────────
  const sleepMoodValues = sleepMoodData.map((item) => Number(item.avg_stress ?? 0));
  const sleepMoodLabels = sleepMoodData.map((item) =>
    item.hours !== undefined ? `${item.hours}h` : ''
  );
  const sleepMoodChange = formatChange(
    sleepMoodValues[sleepMoodValues.length - 1],
    sleepMoodValues[sleepMoodValues.length - 2]
  );

  // ─── 4 Metric Boxes ──────────────────────────────────────────────────────
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
      change: '',
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

  // ─── All Charts ──────────────────────────────────────────────────────────
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
      data: movementValues,
      insight: movementInsight || summaryText,
      labels: movementLabels,
      stat: movementChange,
      subtitle: movementInsight || 'Movement compared with stress level',
      themeColor: themeColors['movement-stress'],
      title: 'Movement Vs Stress',
      type: 'movement-stress',
    },
    {
      data: sleepStressValues,
      insight: '',
      labels: sleepStressLabels,
      stat: sleepChange,
      subtitle: 'Sleep quality compared with mood',
      themeColor: themeColors['sleep-stress'],
      title: 'Sleep Quality Vs Mood',
      type: 'sleep-stress',
    },
    {
      data: taskValues,
      insight: tasksInsight,
      labels: taskLabels,
      stat: tasksChange,
      subtitle: tasksInsight || 'Tasks completed vs stress level',
      themeColor: themeColors['tasks-stress'],
      title: 'Tasks Completed Vs Stress',
      type: 'tasks-stress',
    },
    {
      data: sleepMoodValues,
      insight: summaryText,
      labels: sleepMoodLabels,
      stat: sleepMoodChange,
      subtitle: 'Sleep score compared with stress level',
      themeColor: themeColors['sleep-mood'],
      title: 'Sleep Score Vs Stress',
      type: 'sleep-mood',
    },
    {
      data: soundscapeValues,
      insight: summaryText,
      labels: soundscapeLabels,
      stat: totalSoundscape > 0 ? String(totalSoundscape) : soundscapeChange,
      subtitle: 'Soundscape usage compared with stress level',
      themeColor: themeColors['soundscape-usage'],
      title: 'Soundscape Usage Vs Stress',
      type: 'soundscape-usage',
    },
  ];

  // ─── Chart Details (for insight-details screen) ───────────────────────────
  const chartDetails: ProgressResponse['chartDetails'] = {
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
    'daily-ease-trend': {
      periods: {
        Week: buildPeriod(dailyEaseLabels, dailyEaseValues, summaryText, [
          {
            change: dailyEaseChange,
            changeTone: toneFromChange(dailyEaseChange, false),
            icon: 'analytics-outline',
            label: 'Daily Ease',
            themeColor: themeColors['daily-ease-trend'],
            value: dailyEaseStat || '0',
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
      subtitle: summaryText || 'Daily ease trend over 30 days',
      themeColor: themeColors['daily-ease-trend'],
      title: 'Daily Ease Trend',
      type: 'daily-ease-trend',
    },
    'sleep-stress': {
      periods: {
        Week: buildPeriod(sleepStressLabels, sleepStressValues, 'Sleep quality compared with stress', [
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
            value: formatNumber(sleepStressData.length, 0),
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
            value: formatNumber(average(sleepStressValues)),
          },
        ]),
      },
      subtitle: 'Sleep quality compared with mood',
      themeColor: themeColors['sleep-stress'],
      title: 'Sleep Quality Vs Mood',
      type: 'sleep-stress',
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
      subtitle: 'Tasks completed vs stress level',
      themeColor: themeColors['tasks-stress'],
      title: 'Tasks Completed Vs Stress',
      type: 'tasks-stress',
    },
    'breathwork-minutes': {
      periods: {
        Week: buildPeriod(breathworkMinLabels, breathworkMinValues, stress?.insight ?? summaryText, [
          {
            change: breathworkMinChange,
            changeTone: toneFromChange(breathworkMinChange),
            icon: 'leaf-outline',
            label: 'Avg stress',
            themeColor: themeColors['breathwork-minutes'],
            value: formatNumber(average(breathworkMinValues)),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'time-outline',
            label: 'Sessions',
            themeColor: themeColors['breathwork-minutes'],
            value: formatNumber(totalBreathwork, 0),
          },
          {
            change: stressChange,
            changeTone: toneFromChange(stressChange),
            icon: 'heart-outline',
            label: 'Overall stress',
            themeColor: themeColors['breathwork-minutes'],
            value: formatNumber(avgStress),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'moon-outline',
            label: 'Sleep',
            themeColor: themeColors['breathwork-minutes'],
            value: formatNumber(avgSleep),
          },
        ]),
      },
      subtitle: 'How breathwork duration affects stress',
      themeColor: themeColors['breathwork-minutes'],
      title: 'Breathwork Vs Stress',
      type: 'breathwork-minutes',
    },
    'movement-stress': {
      periods: {
        Week: buildPeriod(movementLabels, movementValues, movementInsight || summaryText, [
          {
            change: movementChange,
            changeTone: toneFromChange(movementChange),
            icon: 'walk-outline',
            label: 'Avg stress',
            themeColor: themeColors['movement-stress'],
            value: formatNumber(average(movementValues)),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'musical-notes-outline',
            label: 'Soundscape',
            themeColor: themeColors['movement-stress'],
            value: formatNumber(totalSoundscape, 0),
          },
          {
            change: stressChange,
            changeTone: toneFromChange(stressChange),
            icon: 'heart-outline',
            label: 'Overall stress',
            themeColor: themeColors['movement-stress'],
            value: formatNumber(avgStress),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'leaf-outline',
            label: 'Breathwork',
            themeColor: themeColors['movement-stress'],
            value: formatNumber(totalBreathwork, 0),
          },
        ]),
      },
      subtitle: movementInsight || 'Soundscape usage vs stress level',
      themeColor: themeColors['movement-stress'],
      title: 'Movement Vs Stress',
      type: 'movement-stress',
    },
    'mood-frequency': {
      periods: {
        Week: buildPeriod(moodFreqLabels, moodFreqValues, summaryText, [
          {
            change: '',
            changeTone: 'positive',
            icon: 'happy-outline',
            label: 'Total logs',
            themeColor: themeColors['mood-frequency'],
            value: String(totalMoodCount),
          },
          {
            change: stressChange,
            changeTone: toneFromChange(stressChange),
            icon: 'heart-outline',
            label: 'Avg stress',
            themeColor: themeColors['mood-frequency'],
            value: formatNumber(avgStress),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'leaf-outline',
            label: 'Breathwork',
            themeColor: themeColors['mood-frequency'],
            value: formatNumber(totalBreathwork, 0),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'moon-outline',
            label: 'Sleep',
            themeColor: themeColors['mood-frequency'],
            value: formatNumber(avgSleep),
          },
        ]),
      },
      subtitle: 'How often each mood was logged',
      themeColor: themeColors['mood-frequency'],
      title: 'Mood Frequency',
      type: 'mood-frequency',
    },
    'breathing-usage': {
      periods: {
        Week: buildPeriod(breathingUsageLabels, breathingUsageValues, summaryText, [
          {
            change: '',
            changeTone: 'positive',
            icon: 'leaf-outline',
            label: 'Total sessions',
            themeColor: themeColors['breathing-usage'],
            value: formatNumber(totalBreathwork, 0),
          },
          {
            change: stressChange,
            changeTone: toneFromChange(stressChange),
            icon: 'heart-outline',
            label: 'Avg stress',
            themeColor: themeColors['breathing-usage'],
            value: formatNumber(avgStress),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'moon-outline',
            label: 'Sleep',
            themeColor: themeColors['breathing-usage'],
            value: formatNumber(avgSleep),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'checkmark-circle-outline',
            label: 'Tasks',
            themeColor: themeColors['breathing-usage'],
            value: formatNumber(avgTask, 0),
          },
        ]),
      },
      subtitle: 'Sessions per breathing technique',
      themeColor: themeColors['breathing-usage'],
      title: 'Breathing Usage',
      type: 'breathing-usage',
    },
    'soundscape-usage': {
      periods: {
        Week: buildPeriod(soundscapeLabels, soundscapeValues, summaryText, [
          {
            change: soundscapeChange,
            changeTone: toneFromChange(soundscapeChange, false),
            icon: 'musical-notes-outline',
            label: 'Total plays',
            themeColor: themeColors['soundscape-usage'],
            value: String(totalSoundscape),
          },
          {
            change: stressChange,
            changeTone: toneFromChange(stressChange),
            icon: 'heart-outline',
            label: 'Avg stress',
            themeColor: themeColors['soundscape-usage'],
            value: formatNumber(avgStress),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'leaf-outline',
            label: 'Breathwork',
            themeColor: themeColors['soundscape-usage'],
            value: formatNumber(totalBreathwork, 0),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'moon-outline',
            label: 'Sleep',
            themeColor: themeColors['soundscape-usage'],
            value: formatNumber(avgSleep),
          },
        ]),
      },
      subtitle: 'Soundscape usage compared with stress level',
      themeColor: themeColors['soundscape-usage'],
      title: 'Soundscape Usage Vs Stress',
      type: 'soundscape-usage',
    },
    'sleep-mood': {
      periods: {
        Week: buildPeriod(sleepMoodLabels, sleepMoodValues, summaryText, [
          {
            change: sleepMoodChange,
            changeTone: toneFromChange(sleepMoodChange),
            icon: 'moon-outline',
            label: 'Avg stress',
            themeColor: themeColors['sleep-mood'],
            value: formatNumber(average(sleepMoodValues)),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'bed-outline',
            label: 'Avg sleep',
            themeColor: themeColors['sleep-mood'],
            value: formatNumber(avgSleep),
          },
          {
            change: stressChange,
            changeTone: toneFromChange(stressChange),
            icon: 'heart-outline',
            label: 'Overall stress',
            themeColor: themeColors['sleep-mood'],
            value: formatNumber(avgStress),
          },
          {
            change: '',
            changeTone: 'positive',
            icon: 'leaf-outline',
            label: 'Breathwork',
            themeColor: themeColors['sleep-mood'],
            value: formatNumber(totalBreathwork, 0),
          },
        ]),
      },
      subtitle: 'Sleep score compared with stress level',
      themeColor: themeColors['sleep-mood'],
      title: 'Sleep Score Vs Stress',
      type: 'sleep-mood',
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
