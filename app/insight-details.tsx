import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { AppFonts } from '@/constants/theme';

const backgroundImage = require('@/assets/images/insight-detail-page-bg-img.png');

type Metric = {
  change: string;
  changeTone: 'positive' | 'negative';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

type TabItem = 'Day' | 'Week' | 'month' | 'Year';
type InsightType = 'stress-breathwork' | 'movement-stress' | 'sleep-mood' | 'temperature-stress';
type PeriodData = {
  chartData: number[];
  dateRange: string;
  insightMessage: string;
  labels: string[];
  metricCards: Metric[];
};
type InsightDetail = {
  lightThemeColor: string;
  periods: Record<TabItem, PeriodData>;
  subtitle: string;
  themeColor: string;
  title: string;
};

const sharedInsightFilters = {
  tabs: ['Day', 'Week', 'month', 'Year'] as TabItem[],
  activeTab: 'Week' as TabItem,
};

const periodRangeOptions: Record<TabItem, string[]> = {
  Day: ['Today', 'Yesterday', '2 days ago'],
  Week: ['5-11 May', '12-18 May', '19-25 May'],
  month: ['May', 'April', 'March'],
  Year: ['2026', '2025', '2024'],
};

const insightDetailsData: Record<InsightType, InsightDetail> = {
  'stress-breathwork': {
    title: 'Stress Vs Breathwork',
    subtitle: 'How breathwork affects your stress',
    themeColor: '#FF2B75',
    lightThemeColor: '#FFEAF3',
    periods: {
      Day: {
        dateRange: 'Today',
        labels: ['6a', '9a', '12p', '3p', '6p', '9p'],
        chartData: [4.4, 4.0, 3.7, 3.1, 2.8, 2.6],
        insightMessage: 'Stress eased after your afternoon breathwork sessions.',
        metricCards: [
          { change: '-6% today', changeTone: 'positive', icon: 'heart-outline', label: 'Avg. stress', value: '2.6' },
          { change: '+12% today', changeTone: 'positive', icon: 'leaf-outline', label: 'Breath mins', value: '18' },
          { change: '+5% today', changeTone: 'positive', icon: 'trending-down-outline', label: 'Calm score', value: '4.0' },
          { change: '-1 today', changeTone: 'positive', icon: 'flash-outline', label: 'High stress', value: '1' },
        ],
      },
      Week: {
        dateRange: '5-11 May',
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        chartData: [4.6, 4.2, 3.7, 3.4, 3.0, 2.7, 2.4],
        insightMessage: 'Your stress appears lower on days with more breathwork.',
        metricCards: [
          { change: '-10% last week', changeTone: 'positive', icon: 'heart-outline', label: 'Avg. stress', value: '2.8' },
          { change: '+18% last week', changeTone: 'positive', icon: 'leaf-outline', label: 'Breath mins', value: '42' },
          { change: '+7% last week', changeTone: 'positive', icon: 'trending-down-outline', label: 'Calm score', value: '4.1' },
          { change: '-3% last week', changeTone: 'negative', icon: 'flash-outline', label: 'High stress', value: '3' },
        ],
      },
      month: {
        dateRange: 'May',
        labels: ['W1', 'W2', 'W3', 'W4'],
        chartData: [4.2, 3.8, 3.2, 2.7],
        insightMessage: 'Monthly stress trends down as breathwork consistency improves.',
        metricCards: [
          { change: '-14% last month', changeTone: 'positive', icon: 'heart-outline', label: 'Avg. stress', value: '3.1' },
          { change: '+24% last month', changeTone: 'positive', icon: 'leaf-outline', label: 'Breath mins', value: '168' },
          { change: '+9% last month', changeTone: 'positive', icon: 'trending-down-outline', label: 'Calm score', value: '4.0' },
          { change: '-5 last month', changeTone: 'positive', icon: 'flash-outline', label: 'High stress', value: '9' },
        ],
      },
      Year: {
        dateRange: '2026',
        labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
        chartData: [4.5, 4.1, 3.6, 3.2, 2.9, 2.6],
        insightMessage: 'Long-term breathwork practice is linked with lower stress.',
        metricCards: [
          { change: '-18% this year', changeTone: 'positive', icon: 'heart-outline', label: 'Avg. stress', value: '3.3' },
          { change: '+31% this year', changeTone: 'positive', icon: 'leaf-outline', label: 'Breath mins', value: '1.8k' },
          { change: '+12% this year', changeTone: 'positive', icon: 'trending-down-outline', label: 'Calm score', value: '4.2' },
          { change: '-19 this year', changeTone: 'positive', icon: 'flash-outline', label: 'High stress', value: '41' },
        ],
      },
    },
  },
  'movement-stress': {
    title: 'Movement Vs Stress',
    subtitle: 'How movement impacts stress',
    themeColor: '#22C55E',
    lightThemeColor: '#EAFBEF',
    periods: {
      Day: {
        dateRange: 'Today',
        labels: ['6a', '9a', '12p', '3p', '6p', '9p'],
        chartData: [2.5, 2.9, 3.4, 3.8, 4.2, 4.4],
        insightMessage: 'Short movement breaks helped your stress settle today.',
        metricCards: [
          { change: '+8% today', changeTone: 'positive', icon: 'walk-outline', label: 'Movement', value: '3.1k' },
          { change: '-4% today', changeTone: 'positive', icon: 'heart-outline', label: 'Stress Level', value: '2.7' },
          { change: '+5% today', changeTone: 'positive', icon: 'leaf-outline', label: 'Recovery', value: '4.1' },
          { change: '+16% today', changeTone: 'positive', icon: 'time-outline', label: 'Active mins', value: '32' },
        ],
      },
      Week: {
        dateRange: '5-11 May',
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        chartData: [2.7, 3.0, 3.3, 3.8, 4.1, 4.5, 4.7],
        insightMessage: 'More movement is linked with lower stress.',
        metricCards: [
          { change: '+14% last week', changeTone: 'positive', icon: 'walk-outline', label: 'Movement', value: '6.2k' },
          { change: '-9% last week', changeTone: 'positive', icon: 'heart-outline', label: 'Stress Level', value: '2.6' },
          { change: '+11% last week', changeTone: 'positive', icon: 'leaf-outline', label: 'Recovery', value: '4.4' },
          { change: '+22% last week', changeTone: 'positive', icon: 'time-outline', label: 'Active mins', value: '96' },
        ],
      },
      month: {
        dateRange: 'May',
        labels: ['W1', 'W2', 'W3', 'W4'],
        chartData: [3.1, 3.5, 4.0, 4.5],
        insightMessage: 'Movement has steadily increased through the month.',
        metricCards: [
          { change: '+19% last month', changeTone: 'positive', icon: 'walk-outline', label: 'Movement', value: '24k' },
          { change: '-11% last month', changeTone: 'positive', icon: 'heart-outline', label: 'Stress Level', value: '2.9' },
          { change: '+13% last month', changeTone: 'positive', icon: 'leaf-outline', label: 'Recovery', value: '4.3' },
          { change: '+28% last month', changeTone: 'positive', icon: 'time-outline', label: 'Active mins', value: '410' },
        ],
      },
      Year: {
        dateRange: '2026',
        labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
        chartData: [2.8, 3.1, 3.5, 3.9, 4.3, 4.6],
        insightMessage: 'Your yearly movement trend is improving alongside calmer stress patterns.',
        metricCards: [
          { change: '+25% this year', changeTone: 'positive', icon: 'walk-outline', label: 'Movement', value: '286k' },
          { change: '-15% this year', changeTone: 'positive', icon: 'heart-outline', label: 'Stress Level', value: '3.0' },
          { change: '+16% this year', changeTone: 'positive', icon: 'leaf-outline', label: 'Recovery', value: '4.2' },
          { change: '+35% this year', changeTone: 'positive', icon: 'time-outline', label: 'Active mins', value: '4.8k' },
        ],
      },
    },
  },
  'sleep-mood': {
    title: 'Sleep VS mood',
    subtitle: 'How sleep affects your mood',
    themeColor: '#8B7CFF',
    lightThemeColor: '#F0EEFF',
    periods: {
      Day: {
        dateRange: 'Today',
        labels: ['6a', '9a', '12p', '3p', '6p', '9p'],
        chartData: [3.6, 3.8, 4.0, 4.1, 4.3, 4.4],
        insightMessage: 'Your mood improved after a steadier sleep night.',
        metricCards: [
          { change: '+6% today', changeTone: 'positive', icon: 'happy-outline', label: 'Avg. mood', value: '4.1' },
          { change: '+4% today', changeTone: 'positive', icon: 'moon-outline', label: 'Avg. Sleep', value: '4.4' },
          { change: '-1 today', changeTone: 'positive', icon: 'cloudy-night-outline', label: 'Restless', value: '1' },
          { change: '+12% today', changeTone: 'positive', icon: 'sparkles-outline', label: 'Wind down', value: '24' },
        ],
      },
      Week: {
        dateRange: '5-11 May',
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        chartData: [3.8, 4.0, 4.1, 4.3, 4.2, 4.6, 4.5],
        insightMessage: 'Better sleep is linked with improved mood.',
        metricCards: [
          { change: '+12% last week', changeTone: 'positive', icon: 'happy-outline', label: 'Avg. mood', value: '4.2' },
          { change: '+8% last week', changeTone: 'positive', icon: 'moon-outline', label: 'Avg. Sleep', value: '4.6' },
          { change: '-4% last week', changeTone: 'negative', icon: 'cloudy-night-outline', label: 'Restless', value: '2' },
          { change: '+20% last week', changeTone: 'positive', icon: 'sparkles-outline', label: 'Wind down', value: '128' },
        ],
      },
      month: {
        dateRange: 'May',
        labels: ['W1', 'W2', 'W3', 'W4'],
        chartData: [3.7, 4.0, 4.2, 4.5],
        insightMessage: 'Mood has improved across the month as sleep became steadier.',
        metricCards: [
          { change: '+15% last month', changeTone: 'positive', icon: 'happy-outline', label: 'Avg. mood', value: '4.1' },
          { change: '+10% last month', changeTone: 'positive', icon: 'moon-outline', label: 'Avg. Sleep', value: '4.5' },
          { change: '-6% last month', changeTone: 'positive', icon: 'cloudy-night-outline', label: 'Restless', value: '7' },
          { change: '+25% last month', changeTone: 'positive', icon: 'sparkles-outline', label: 'Wind down', value: '480' },
        ],
      },
      Year: {
        dateRange: '2026',
        labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
        chartData: [3.5, 3.7, 4.0, 4.2, 4.4, 4.6],
        insightMessage: 'Your long-term mood trend rises with better sleep routines.',
        metricCards: [
          { change: '+20% this year', changeTone: 'positive', icon: 'happy-outline', label: 'Avg. mood', value: '4.0' },
          { change: '+13% this year', changeTone: 'positive', icon: 'moon-outline', label: 'Avg. Sleep', value: '4.4' },
          { change: '-18% this year', changeTone: 'positive', icon: 'cloudy-night-outline', label: 'Restless', value: '64' },
          { change: '+29% this year', changeTone: 'positive', icon: 'sparkles-outline', label: 'Wind down', value: '5.1k' },
        ],
      },
    },
  },
  'temperature-stress': {
    title: 'Temperature Vs Stress',
    subtitle: 'How body warmth relates to calmness',
    themeColor: '#FF7A59',
    lightThemeColor: '#FFF0EA',
    periods: {
      Day: {
        dateRange: 'Today',
        labels: ['6a', '9a', '12p', '3p', '6p', '9p'],
        chartData: [4.2, 4.1, 3.9, 3.8, 3.6, 3.5],
        insightMessage: 'Your calm score improved as warmth became steadier today.',
        metricCards: [
          { change: '+2% today', changeTone: 'positive', icon: 'thermometer-outline', label: 'Warmth', value: '4.1' },
          { change: '-2% today', changeTone: 'positive', icon: 'heart-outline', label: 'Stress Level', value: '2.8' },
          { change: '+4% today', changeTone: 'positive', icon: 'checkmark-circle-outline', label: 'Balance', value: '4.2' },
          { change: '+1 today', changeTone: 'positive', icon: 'sunny-outline', label: 'Calm hrs', value: '6' },
        ],
      },
      Week: {
        dateRange: '5-11 May',
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        chartData: [4.4, 4.2, 4.0, 3.8, 3.6, 3.5, 3.4],
        insightMessage: 'Warmer, calmer patterns may be linked with lower stress.',
        metricCards: [
          { change: '+5% last week', changeTone: 'positive', icon: 'thermometer-outline', label: 'Warmth', value: '4.0' },
          { change: '-3% last week', changeTone: 'positive', icon: 'heart-outline', label: 'Stress Level', value: '2.9' },
          { change: '+6% last week', changeTone: 'positive', icon: 'checkmark-circle-outline', label: 'Balance', value: '4.3' },
          { change: '+9% last week', changeTone: 'positive', icon: 'sunny-outline', label: 'Calm days', value: '5' },
        ],
      },
      month: {
        dateRange: 'May',
        labels: ['W1', 'W2', 'W3', 'W4'],
        chartData: [4.1, 3.9, 3.7, 3.5],
        insightMessage: 'Monthly warmth balance is tracking with lower stress.',
        metricCards: [
          { change: '+7% last month', changeTone: 'positive', icon: 'thermometer-outline', label: 'Warmth', value: '4.1' },
          { change: '-6% last month', changeTone: 'positive', icon: 'heart-outline', label: 'Stress Level', value: '3.0' },
          { change: '+8% last month', changeTone: 'positive', icon: 'checkmark-circle-outline', label: 'Balance', value: '4.2' },
          { change: '+12% last month', changeTone: 'positive', icon: 'sunny-outline', label: 'Calm days', value: '19' },
        ],
      },
      Year: {
        dateRange: '2026',
        labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
        chartData: [4.3, 4.1, 3.9, 3.7, 3.5, 3.4],
        insightMessage: 'Yearly calm patterns improve when warmth remains balanced.',
        metricCards: [
          { change: '+9% this year', changeTone: 'positive', icon: 'thermometer-outline', label: 'Warmth', value: '4.0' },
          { change: '-10% this year', changeTone: 'positive', icon: 'heart-outline', label: 'Stress Level', value: '3.1' },
          { change: '+11% this year', changeTone: 'positive', icon: 'checkmark-circle-outline', label: 'Balance', value: '4.1' },
          { change: '+16% this year', changeTone: 'positive', icon: 'sunny-outline', label: 'Calm days', value: '211' },
        ],
      },
    },
  },
};

const navItems = [
  { icon: 'home-outline', label: 'Home' },
  { icon: 'happy-outline', label: 'Mood' },
  { icon: 'leaf-outline', label: 'Tools' },
  { icon: 'stats-chart', label: 'Progress' },
  { icon: 'person-outline', label: 'Profile' },
] satisfies { icon: keyof typeof Ionicons.glyphMap; label: string }[];

function shiftMetricValue(value: string, selectedIndex: number) {
  if (selectedIndex === 0) {
    return value;
  }

  const numericValue = Number.parseFloat(value);
  if (Number.isNaN(numericValue)) {
    return value;
  }

  if (value.includes('k')) {
    return `${Math.max(0, numericValue - selectedIndex * 0.2).toFixed(1)}k`;
  }

  if (value.includes('.')) {
    return Math.max(0, numericValue - selectedIndex * 0.1).toFixed(1);
  }

  return `${Math.max(0, Math.round(numericValue - selectedIndex * 3))}`;
}

function getSelectedPeriodData(basePeriodData: PeriodData, activeTab: TabItem, selectedIndex: number) {
  if (selectedIndex === 0) {
    return basePeriodData;
  }

  const adjustment = selectedIndex === 1 ? -0.18 : 0.14;
  return {
    ...basePeriodData,
    dateRange: periodRangeOptions[activeTab][selectedIndex],
    chartData: basePeriodData.chartData.map((value, index) =>
      Math.max(1, Math.min(5, value + adjustment + index * adjustment * 0.15)),
    ),
    insightMessage: `${basePeriodData.insightMessage} (${periodRangeOptions[activeTab][selectedIndex]})`,
    metricCards: basePeriodData.metricCards.map((metric) => ({
      ...metric,
      value: shiftMetricValue(metric.value, selectedIndex),
    })),
  };
}

function SegmentedTabs({
  activeTab,
  onChange,
  themeColor,
  tabs,
}: {
  activeTab: TabItem;
  onChange: (tab: TabItem) => void;
  themeColor: string;
  tabs: TabItem[];
}) {
  return (
    <View style={styles.segmentedTabs}>
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={({ pressed }) => [
              styles.segmentTab,
              isActive && { backgroundColor: themeColor },
              pressed && styles.segmentTabPressed,
            ]}>
            <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MetricCard({
  lightThemeColor,
  metric,
  themeColor,
}: {
  lightThemeColor: string;
  metric: Metric;
  themeColor: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: lightThemeColor }]}>
        <Ionicons color={themeColor} name={metric.icon} size={13} />
      </View>
      <Text numberOfLines={1} style={styles.metricLabel}>
        {metric.label}
      </Text>
      <Text style={styles.metricValue}>{metric.value}</Text>
      <Text
        numberOfLines={1}
        style={[
          styles.metricChange,
          metric.changeTone === 'positive' ? styles.metricPositive : styles.metricNegative,
        ]}>
        {metric.change}
      </Text>
    </View>
  );
}

function createSmoothPath(points: { x: number; y: number }[]) {
  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];
    const controlX = previous.x + (point.x - previous.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
}

function MoodTrendChart({
  chartData,
  labels,
  lightThemeColor,
  themeColor,
}: {
  chartData: number[];
  labels: string[];
  lightThemeColor: string;
  themeColor: string;
}) {
  const chartWidth = 320;
  const chartHeight = 176;
  const left = 30;
  const right = 14;
  const top = 14;
  const bottom = 32;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;
  const maxValue = 5;
  const minValue = 1;
  const points = chartData.map((value, index) => ({
    x: left + (plotWidth / (chartData.length - 1)) * index,
    y: top + ((maxValue - value) / (maxValue - minValue)) * plotHeight,
  }));
  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${top + plotHeight} L ${points[0].x} ${top + plotHeight} Z`;

  return (
    <Svg style={styles.moodChartSvg} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
      <Defs>
        <SvgLinearGradient id="moodArea" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor={themeColor} stopOpacity={0.28} />
          <Stop offset="1" stopColor={lightThemeColor} stopOpacity={0.25} />
        </SvgLinearGradient>
      </Defs>
      {[5, 4, 3, 2, 1].map((tick) => {
        const y = top + ((maxValue - tick) / (maxValue - minValue)) * plotHeight;
        return (
          <SvgText fill="#8B90A0" fontSize="9" key={tick} textAnchor="end" x={left - 10} y={y + 3}>
            {tick}
          </SvgText>
        );
      })}
      <Path d={areaPath} fill="url(#moodArea)" />
      <Path d={linePath} fill="none" stroke={themeColor} strokeLinecap="round" strokeWidth={3} />
      {points.map((point, index) => (
        <Circle
          cx={point.x}
          cy={point.y}
          fill="#FFFFFF"
          key={`${point.x}-${point.y}`}
          r={4}
          stroke={themeColor}
          strokeWidth={2}
        />
      ))}
      {labels.map((label, index) => (
        <SvgText
          fill="#6F7484"
          fontSize="9"
          key={label}
          textAnchor="middle"
          x={left + (plotWidth / (labels.length - 1)) * index}
          y={chartHeight - 8}>
          {label}
        </SvgText>
      ))}
    </Svg>
  );
}

function BottomNav({ bottomInset }: { bottomInset: number }) {
  return (
    <View style={[styles.bottomNavWrap, { paddingBottom: bottomInset + 8 }]}>
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = item.label === 'Progress';
          return (
            <View key={item.label} style={styles.navItem}>
              <Ionicons color={isActive ? '#3770FC' : '#8C8C8C'} name={item.icon} size={20} />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function InsightDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabItem>(sharedInsightFilters.activeTab);
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false);
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const selectedType = (
    params.type && params.type in insightDetailsData ? params.type : 'stress-breathwork'
  ) as InsightType;
  const detail = insightDetailsData[selectedType];
  const rangeOptions = periodRangeOptions[activeTab];
  const periodData = getSelectedPeriodData(detail.periods[activeTab], activeTab, selectedRangeIndex);
  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab);
    setSelectedRangeIndex(0);
    setIsRangeDropdownOpen(false);
  };

  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 112 },
          ]}
          showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            accessibilityLabel="Go back"
            activeOpacity={0.75}
            onPress={() => router.back()}
            style={styles.backButton}>
            <Ionicons color="#173F5F" name="chevron-back" size={16} />
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Insight Details</Text>
            <Text style={styles.subtitle}>A closer look at your progress</Text>
          </View>

          <View style={styles.mainCard}>
            <View style={styles.filterRow}>
              <SegmentedTabs
                activeTab={activeTab}
                onChange={handleTabChange}
                tabs={sharedInsightFilters.tabs}
                themeColor={detail.themeColor}
              />
              <View style={styles.dateSelectWrap}>
                <Pressable
                  onPress={() => setIsRangeDropdownOpen((current) => !current)}
                  style={({ pressed }) => [styles.dateSelect, pressed && styles.dateSelectPressed]}>
                  <Text style={styles.dateText}>{periodData.dateRange}</Text>
                  <Ionicons
                    color="#173F5F"
                    name={isRangeDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={12}
                  />
                </Pressable>
                {isRangeDropdownOpen ? (
                  <View style={styles.dateDropdown}>
                    {rangeOptions.map((option, index) => {
                      const isSelected = index === selectedRangeIndex;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => {
                            setSelectedRangeIndex(index);
                            setIsRangeDropdownOpen(false);
                          }}
                          style={[
                            styles.dateDropdownItem,
                            isSelected && { backgroundColor: detail.lightThemeColor },
                          ]}>
                          <Text
                            style={[
                              styles.dateDropdownText,
                              isSelected && { color: detail.themeColor },
                            ]}>
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.metricsRow}>
              {periodData.metricCards.map((metric) => (
                <MetricCard
                  key={metric.label}
                  lightThemeColor={detail.lightThemeColor}
                  metric={metric}
                  themeColor={detail.themeColor}
                />
              ))}
            </View>

            <View style={[styles.trendCard, { shadowColor: detail.themeColor }]}>
              <View style={styles.trendHeader}>
                <View>
                  <Text style={styles.trendTitle}>{detail.title}</Text>
                  <Text style={styles.trendSubtitle}>{detail.subtitle}</Text>
                </View>
                <View style={styles.scoreDropdown}>
                  <Text style={styles.scoreDropdownText}>Week</Text>
                  <Ionicons color="#7B8190" name="chevron-down" size={11} />
                </View>
              </View>

              <MoodTrendChart
                chartData={periodData.chartData}
                labels={periodData.labels}
                lightThemeColor={detail.lightThemeColor}
                themeColor={detail.themeColor}
              />

              <View style={[styles.insightBanner, { backgroundColor: detail.lightThemeColor }]}>
                <Ionicons color={detail.themeColor} name="sparkles" size={15} />
                <Text style={[styles.insightText, { color: detail.themeColor }]}>
                  {periodData.insightMessage}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav bottomInset={insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    width: 30,
  },
  backgroundImage: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bottomNav: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    flexDirection: 'row',
    height: 70,
    justifyContent: 'space-around',
    maxWidth: 430,
    paddingHorizontal: 12,
    shadowColor: '#3770FC',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    width: '100%',
  },
  bottomNavWrap: {
    bottom: 0,
    left: 12,
    position: 'absolute',
    right: 12,
  },
  dateSelect: {
    alignItems: 'center',
    backgroundColor: '#F7F8FF',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 5,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  dateDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 12,
    padding: 4,
    position: 'absolute',
    right: 0,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    top: 39,
    width: 100,
    zIndex: 20,
  },
  dateDropdownItem: {
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dateDropdownText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 10,
    lineHeight: 13,
  },
  dateSelectPressed: {
    opacity: 0.82,
  },
  dateSelectWrap: {
    elevation: 12,
    position: 'relative',
    zIndex: 20,
  },
  dateText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 10,
    lineHeight: 14,
  },
  filterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    zIndex: 30,
  },
  insightBanner: {
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  insightText: {
    color: '#6E5EE8',
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginTop: 22,
    padding: 12,
    shadowColor: '#8E86D8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    width: '100%',
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 5,
    paddingVertical: 9,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
  },
  metricChange: {
    fontFamily: AppFonts.sansRegular,
    fontSize: 6,
    lineHeight: 9,
    marginTop: 3,
  },
  metricIcon: {
    alignItems: 'center',
    backgroundColor: '#F1EEFF',
    borderRadius: 12,
    height: 22,
    justifyContent: 'center',
    marginBottom: 6,
    width: 22,
  },
  metricLabel: {
    color: '#6F7484',
    fontFamily: AppFonts.sansRegular,
    fontSize: 7,
    lineHeight: 10,
    textAlign: 'center',
  },
  metricNegative: {
    color: '#FF3D6E',
  },
  metricPositive: {
    color: '#20B56B',
  },
  metricValue: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 12,
    zIndex: 1,
  },
  moodChartSvg: {
    aspectRatio: 320 / 176,
    marginTop: 10,
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  navLabel: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansMedium,
    fontSize: 10,
    lineHeight: 13,
  },
  navLabelActive: {
    color: '#3770FC',
  },
  safeArea: {
    flex: 1,
  },
  scoreDropdown: {
    alignItems: 'center',
    backgroundColor: '#F7F8FF',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  scoreDropdownText: {
    color: '#7B8190',
    fontFamily: AppFonts.sansMedium,
    fontSize: 10,
    lineHeight: 13,
  },
  screen: {
    backgroundColor: '#EEF0FF',
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  segmentTab: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    height: 28,
    justifyContent: 'center',
  },
  segmentTabPressed: {
    opacity: 0.82,
  },
  segmentText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 10,
    lineHeight: 13,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  segmentedTabs: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  subtitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 30,
    lineHeight: 38,
  },
  titleBlock: {
    marginTop: 16,
  },
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 12,
    padding: 12,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  trendHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendSubtitle: {
    color: '#6F7484',
    fontFamily: AppFonts.sansRegular,
    fontSize: 9,
    lineHeight: 12,
    marginTop: 2,
  },
  trendTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
  },
});
