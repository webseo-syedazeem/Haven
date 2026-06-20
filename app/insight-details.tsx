import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { useProgress } from '@/contexts/ProgressContext';
import {
  type ProgressChartDetail,
  type ProgressChartType,
  type ProgressMetric,
  type ProgressPeriod,
} from '@/services/progressService';

const backgroundImage = require('@/assets/images/insight-detail-page-bg-img.png');

const chartTypes: ProgressChartType[] = [
  'stress-breathwork',
  'daily-ease-trend',
  'sleep-stress',
  'tasks-stress',
];
const tabs: ProgressPeriod[] = ['Day', 'Week', 'Month', 'Year'];
const navItems = [
  { icon: 'home-outline', label: 'Home' },
  { icon: 'happy-outline', label: 'Mood' },
  { icon: 'leaf-outline', label: 'Tools' },
  { icon: 'stats-chart', label: 'Progress' },
  { icon: 'person-outline', label: 'Profile' },
] satisfies { icon: keyof typeof Ionicons.glyphMap; label: string }[];

function isProgressChartType(value: string | undefined): value is ProgressChartType {
  return Boolean(value && chartTypes.includes(value as ProgressChartType));
}

function hexToRgba(hex: string, opacity: number) {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    return `rgba(55, 112, 252, ${opacity})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function getMetricIcon(metric: ProgressMetric): keyof typeof Ionicons.glyphMap {
  const icon = metric.icon as keyof typeof Ionicons.glyphMap | undefined;

  if (icon) {
    return icon;
  }

  const label = metric.label.toLowerCase();

  if (label.includes('sleep')) {
    return 'moon-outline';
  }

  if (label.includes('breath')) {
    return 'leaf-outline';
  }

  if (label.includes('stress') || label.includes('heart')) {
    return 'heart-outline';
  }

  return 'analytics-outline';
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

function splitChartLabel(label: string) {
  const trimmedLabel = label.trim();
  const normalized = trimmedLabel.toLowerCase();
  const labelMap: Record<string, string[]> = {
    breathwork: ['Breathwork'],
    'no breathwork': ['No', 'breathwork'],
    'high completion': ['High', 'completion'],
    'low completion': ['Low', 'completion'],
  };

  if (labelMap[normalized]) {
    return labelMap[normalized];
  }

  const words = trimmedLabel.split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    return [trimmedLabel];
  }

  if (words.length === 2) {
    return words;
  }

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')];
}

function SegmentedTabs({
  activeTab,
  onChange,
  themeColor,
}: {
  activeTab: ProgressPeriod;
  onChange: (tab: ProgressPeriod) => void;
  themeColor: string;
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
  metric: ProgressMetric;
  themeColor: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: lightThemeColor }]}>
        <Ionicons color={themeColor} name={getMetricIcon(metric)} size={13} />
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
  const bottom = 34;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;
  const safeData = chartData.length ? chartData : [0, 0];
  const safeLabels = labels.length ? labels : safeData.map((_, index) => String(index + 1));
  const maxValue = Math.max(5, ...safeData);
  const minValue = Math.min(0, ...safeData);
  const range = Math.max(1, maxValue - minValue);
  const points = safeData.map((value, index) => ({
    x: left + (plotWidth / Math.max(1, safeData.length - 1)) * index,
    y: top + ((maxValue - value) / range) * plotHeight,
  }));
  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${top + plotHeight} L ${points[0].x} ${top + plotHeight} Z`;
  const ticks = [maxValue, (maxValue + minValue) / 2, minValue];

  return (
    <Svg
      style={styles.moodChartSvg}
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
      <Defs>
        <SvgLinearGradient id="moodArea" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor={themeColor} stopOpacity={0.28} />
          <Stop offset="1" stopColor={lightThemeColor} stopOpacity={0.25} />
        </SvgLinearGradient>
      </Defs>
      {ticks.map((tick) => {
        const y = top + ((maxValue - tick) / range) * plotHeight;
        return (
          <SvgText fill="#8B90A0" fontSize="9" key={tick} textAnchor="end" x={left - 10} y={y + 3}>
            {Number.isInteger(tick) ? tick : tick.toFixed(1)}
          </SvgText>
        );
      })}
      <Path d={areaPath} fill="url(#moodArea)" />
      <Path d={linePath} fill="none" stroke={themeColor} strokeLinecap="round" strokeWidth={3} />
      {points.map((point) => (
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
      {safeLabels.map((label, index) => {
        const lines = splitChartLabel(label);
        const x = left + (plotWidth / Math.max(1, safeLabels.length - 1)) * index;
        const textAnchor = index === 0 ? 'start' : index === safeLabels.length - 1 ? 'end' : 'middle';

        return lines.map((line, lineIndex) => (
          <SvgText
            fill="#6F7484"
            fontSize={line.length > 10 ? '8' : '9'}
            key={`${label}-${index}-${lineIndex}`}
            textAnchor={textAnchor}
            x={x}
            y={chartHeight - 16 + lineIndex * 10}>
            {line}
          </SvgText>
        ));
      })}
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

function getInitialPeriod(detail: ProgressChartDetail | undefined): ProgressPeriod {
  return detail?.periods.Day ? 'Day' : tabs.find((tab) => detail?.periods[tab]) ?? 'Week';
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.stateCard}>
      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}

export default function InsightDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const insets = useSafeAreaInsets();
  const {
    error,
    isLoading,
    loadProgressIfNeeded,
    progress,
    selectedChartType,
    setSelectedChartType,
  } = useProgress();
  const selectedType = isProgressChartType(params.type) ? params.type : selectedChartType;
  const detail = selectedType ? progress?.chartDetails[selectedType] : undefined;
  const [activeTab, setActiveTab] = useState<ProgressPeriod>('Week');
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false);
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);

  useEffect(() => {
    void loadProgressIfNeeded();
  }, [loadProgressIfNeeded]);

  useEffect(() => {
    if (selectedType) {
      setSelectedChartType(selectedType);
    }
  }, [selectedType, setSelectedChartType]);

  useEffect(() => {
    const initialPeriod = getInitialPeriod(detail);
    setActiveTab(initialPeriod);
    setSelectedRangeIndex(0);
  }, [detail]);

  const periodData = detail?.periods[activeTab];
  const themeColor = detail?.themeColor ?? '#FF2B75';
  const lightThemeColor = useMemo(() => hexToRgba(themeColor, 0.12), [themeColor]);
  const rangeOptions = periodData?.dateRanges.length
    ? periodData.dateRanges
    : periodData?.selectedDateRange
      ? [periodData.selectedDateRange]
      : [];
  const selectedRange = rangeOptions[selectedRangeIndex] ?? periodData?.selectedDateRange ?? '';
  const handleTabChange = (tab: ProgressPeriod) => {
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
            <Ionicons color="#000000" name="chevron-back" size={18} />
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Insight Details</Text>
            <Text style={styles.subtitle}>{detail?.subtitle ?? 'A closer look at your progress'}</Text>
          </View>

          <View style={styles.mainCard}>
            {isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={themeColor} />
                <Text style={styles.stateText}>Loading insight...</Text>
              </View>
            ) : error ? (
              <EmptyState message={error} />
            ) : !detail || !periodData ? (
              <EmptyState message="No insight data is available for this chart yet." />
            ) : (
              <>
                <View style={styles.filterRow}>
                  <SegmentedTabs activeTab={activeTab} onChange={handleTabChange} themeColor={themeColor} />
                  <View style={styles.dateSelectWrap}>
                    <Pressable
                      disabled={!rangeOptions.length}
                      onPress={() => setIsRangeDropdownOpen((current) => !current)}
                      style={({ pressed }) => [styles.dateSelect, pressed && styles.dateSelectPressed]}>
                      <Text style={styles.dateText}>{selectedRange}</Text>
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
                                isSelected && { backgroundColor: lightThemeColor },
                              ]}>
                              <Text
                                style={[
                                  styles.dateDropdownText,
                                  isSelected && { color: themeColor },
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
                      lightThemeColor={lightThemeColor}
                      metric={metric}
                      themeColor={themeColor}
                    />
                  ))}
                </View>

                <View style={[styles.trendCard, { shadowColor: themeColor }]}>
                  <View style={styles.trendHeader}>
                    <View>
                      <Text style={styles.trendTitle}>{detail.title}</Text>
                      <Text style={styles.trendSubtitle}>{detail.subtitle}</Text>
                    </View>
                  </View>

                  <MoodTrendChart
                    chartData={periodData.chartData}
                    labels={periodData.labels}
                    lightThemeColor={lightThemeColor}
                    themeColor={themeColor}
                  />

                  <View style={[styles.insightBanner, { backgroundColor: lightThemeColor }]}>
                    <Ionicons color={themeColor} name="sparkles" size={15} />
                    <Text style={[styles.insightText, { color: themeColor }]}>
                      {periodData.insightMessage}
                    </Text>
                  </View>
                </View>
              </>
            )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    elevation: 3,
    height: 32,
    justifyContent: 'center',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    width: 32,
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
    elevation: 10,
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
    elevation: 2,
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
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  insightText: {
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    elevation: 8,
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
    elevation: 5,
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
    elevation: 2,
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
    elevation: 4,
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  stateCard: {
    alignItems: 'center',
    minHeight: 260,
    justifyContent: 'center',
    padding: 18,
  },
  stateText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
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
    elevation: 6,
    marginTop: 12,
    padding: 12,
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
