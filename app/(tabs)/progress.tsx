import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Line,
  Path,
  Polyline,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { SwipeTabsWrapper } from '@/components/navigation/SwipeTabsWrapper';
import { AppFonts } from '@/constants/theme';
import { useProgress } from '@/contexts/ProgressContext';
import {
  type ProgressChartOverview,
  type ProgressMetric,
} from '@/services/progressService';

const backgroundImage = require('@/assets/images/tool-page-bg-image.png');
const thisWeekBackground = require('@/assets/images/this-week-box-background-img.png');
const thisWeekIcon = require('@/assets/images/this-week-icon.svg');
const breathworkIcon = require('@/assets/images/second-progress-icon.svg');
const sleepIcon = require('@/assets/images/third-progress-icon.svg');
const tasksIcon = require('@/assets/images/forth-progress-icon.svg');
const movementIcon = require('@/assets/images/hugeicons_running-shoes.svg');
const windDownIcon = require('@/assets/images/wind-down-checklist-icon.svg');

type Score = ProgressMetric;

type ChartCard = ProgressChartOverview & {
  barColor?: string;
  barGradientStart?: string;
  barTopGap?: number;
  lineColor?: string;
};

function getMetricVisual(score: Score, index: number) {
  const label = score.label.toLowerCase();

  if (label.includes('breath')) {
    return { iconAsset: breathworkIcon, iconName: undefined, color: '#6339FB' };
  }

  if (label.includes('sleep')) {
    return { iconAsset: sleepIcon, iconName: undefined, color: '#018AFE' };
  }

  if (label.includes('task')) {
    return { iconAsset: tasksIcon, iconName: undefined, color: '#2EB668' };
  }

  const fallbackColors = ['#FF0059', '#6339FB', '#018AFE', '#2EB668'];
  return {
    iconAsset: undefined,
    iconName: (score.icon || 'heart-outline') as keyof typeof Ionicons.glyphMap,
    color: score.themeColor || fallbackColors[index] || '#3770FC',
  };
}

function getChartIcon(card: ChartCard) {
  if (card.type === 'daily-ease-trend') {
    return { iconAsset: movementIcon, iconName: undefined };
  }

  if (card.type === 'sleep-stress' || card.type === 'sleep-mood') {
    return { iconAsset: windDownIcon, iconName: undefined };
  }

  if (card.type === 'tasks-stress') {
    return { iconAsset: undefined, iconName: 'checkmark-circle-outline' as const };
  }

  if (card.type === 'breathwork-minutes' || card.type === 'breathing-usage') {
    return { iconAsset: breathworkIcon, iconName: undefined };
  }

  if (card.type === 'movement-stress' || card.type === 'soundscape-usage') {
    return { iconAsset: undefined, iconName: 'musical-notes-outline' as const };
  }

  if (card.type === 'mood-frequency') {
    return { iconAsset: undefined, iconName: 'happy-outline' as const };
  }

  return { iconAsset: undefined, iconName: 'heart-outline' as const };
}

function getChartVisual(card: ProgressChartOverview): ChartCard {
  if (card.type === 'daily-ease-trend') {
    return {
      ...card,
      barColor: '#0F8F24',
      barGradientStart: '#C8F7CE',
      barTopGap: 7,
      lineColor: '#5FEA6A',
    };
  }

  if (card.type === 'tasks-stress') {
    return {
      ...card,
      barColor: card.themeColor,
      barGradientStart: '#FFD5C8',
      barTopGap: 7,
      lineColor: '#FF8B68',
    };
  }

  if (card.type === 'breathwork-minutes') {
    return {
      ...card,
      barColor: '#5B2FBE',
      barGradientStart: '#D8CFFF',
      barTopGap: 7,
      lineColor: '#8B6EFF',
    };
  }

  if (card.type === 'movement-stress') {
    return {
      ...card,
      barColor: '#0166BE',
      barGradientStart: '#C2E5FF',
      barTopGap: 7,
      lineColor: '#4DAEFF',
    };
  }

  if (card.type === 'breathing-usage') {
    return {
      ...card,
      barColor: '#009688',
      barGradientStart: '#B2EBE8',
      barTopGap: 7,
      lineColor: '#26C6C0',
    };
  }

  if (card.type === 'soundscape-usage') {
    return {
      ...card,
      barColor: '#7B1FA2',
      barGradientStart: '#E1BEF0',
      barTopGap: 7,
      lineColor: '#BA68C8',
    };
  }

  if (card.type === 'sleep-stress') {
    return { ...card, lineColor: '#A18EFF' };
  }

  if (card.type === 'mood-frequency') {
    return { ...card, lineColor: '#FF8C5A' };
  }

  if (card.type === 'sleep-mood') {
    return { ...card, lineColor: '#5B9BFF' };
  }

  return { ...card, lineColor: card.themeColor };
}

function splitChartLabel(label: string) {
  const trimmedLabel = label.trim();
  const normalized = trimmedLabel.toLowerCase();
  const labelMap: Record<string, string[]> = {
    breathwork: ['Breathwork'],
    'high completion': ['High', 'compl.'],
    'low completion': ['Low', 'compl.'],
    'no breathwork': ['No', 'breath.'],
    'light sleep': ['Light', 'sleep'],
    'waking often': ['Waking', 'often'],
    'hard to fall asleep': ['Hard', 'asleep'],
    'very tired': ['Very', 'tired'],
  };

  if (labelMap[normalized]) {
    return labelMap[normalized];
  }

  const words = trimmedLabel.split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    const word = words[0] ?? trimmedLabel;
    return [word.length > 9 ? `${word.slice(0, 8)}.` : word];
  }

  if (words.length === 2) {
    return [words[0], words[1].length > 8 ? `${words[1].slice(0, 7)}.` : words[1]];
  }

  // 3+ words: first two words only
  return [words[0], words[1]];
}

function ScoreCircle({ index, score }: { index: number; score: Score }) {
  const size = 100;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * 0.28;
  const visual = getMetricVisual(score, index);
  const accent = score.themeColor || visual.color;
  const gradientId = `scoreGradient${accent.replace('#', '')}`;
  const iconContent = visual.iconAsset ? (
    <Image
      source={visual.iconAsset}
      style={[styles.scoreIconImage, { tintColor: '#FFFFFF' }]}
      contentFit="contain"
    />
  ) : (
    <Ionicons color="#FFFFFF" name={visual.iconName ?? 'ellipse-outline'} size={16} />
  );

  return (
    <View style={styles.scoreItem}>
      {index === 0 ? (
        <LinearGradient colors={['#FFFFFF', accent]} locations={[0, 1]} style={styles.scoreIcon}>
          {iconContent}
        </LinearGradient>
      ) : (
        <View style={[styles.scoreIcon, { backgroundColor: accent }]}>
          {iconContent}
        </View>
      )}
      <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={accent} />
            <Stop offset="1" stopColor="#FFFFFF" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke="#FFFFFF"
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          origin={`${size / 2}, ${size / 2}`}
          r={radius}
          rotation="-90"
          stroke={`url(#${gradientId})`}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={stroke}
        />
      </Svg>
      <View style={styles.scoreCenter}>
        <Text style={styles.scoreValue}>{score.value}</Text>
        <Text style={styles.scoreLabel}>{score.label}</Text>
        <Text style={[styles.scoreMeta, { color: accent }]}>{score.change}</Text>
      </View>
    </View>
  );
}

function ValueChart({ card }: { card: ChartCard }) {
  const chartWidth = 300;
  const chartHeight = 126;
  const left = 40;
  const right = 16;
  const top = 12;
  const bottom = 34;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;
  const values = card.data.length ? card.data : [0, 0];
  const labels = card.labels.length ? card.labels : values.map((_, index) => String(index + 1));

  const isCountChart = (
    card.type === 'mood-frequency' ||
    card.type === 'breathing-usage' ||
    card.type === 'soundscape-usage'
  );
  const isBarChart = (
    card.type === 'daily-ease-trend' ||
    card.type === 'tasks-stress' ||
    card.type === 'breathwork-minutes' ||
    card.type === 'movement-stress' ||
    card.type === 'breathing-usage' ||
    card.type === 'soundscape-usage'
  );

  const rawMax = Math.max(...values);
  const maxValue = isCountChart
    ? Math.max(rawMax > 0 ? Math.ceil(rawMax * 1.2) : 5, 5)
    : Math.max(100, rawMax);
  const yTicks = isCountChart
    ? [maxValue, Math.round(maxValue / 2), 0]
    : [100, 75, 50, 25, 0];

  const step = plotWidth / Math.max(1, values.length - 1);
  const points = values.map((value, index) => ({
    x: left + index * step,
    y: top + (1 - value / maxValue) * plotHeight,
  }));
  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
  const accent = card.themeColor;
  const barColor = card.barColor ?? accent;
  const barGradientStart = card.barGradientStart ?? barColor;
  const barGradientEndOpacity = card.barGradientStart ? 1 : 0.18;
  const lineColor = card.lineColor ?? accent;
  const gradientId = `chartFill${barColor.replace('#', '')}`;
  const labelStep = plotWidth / Math.max(1, labels.length - 1);

  // Show max 3 labels — first, middle, last — for dense charts
  const visibleLabelIndices = new Set<number>();
  if (labels.length <= 3) {
    labels.forEach((_, i) => visibleLabelIndices.add(i));
  } else {
    visibleLabelIndices.add(0);
    visibleLabelIndices.add(labels.length - 1);
    visibleLabelIndices.add(Math.round((labels.length - 1) / 2));
  }

  const statBubbleWidth = 42;
  const statBubbleHeight = 24;
  const statBubbleGap = 10;
  const statBubbleEdgePadding = 2;
  const statPoint = points[points.length - 1] ?? points[0];
  const statPreviousPoint = points[Math.max(0, points.length - 2)] ?? statPoint;
  const statBubbleX = Math.max(
    statBubbleEdgePadding,
    Math.min(chartWidth - statBubbleWidth - statBubbleEdgePadding, statPoint.x - statBubbleWidth / 2),
  );
  const statSafeLineY = Math.min(statPoint.y, statPreviousPoint.y);
  const statBubbleY = Math.max(statBubbleEdgePadding, statSafeLineY - statBubbleHeight - statBubbleGap);

  return (
    <Svg
      height={chartHeight}
      style={styles.chartSvgOverflow}
      width="100%"
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={barGradientStart} />
          <Stop offset="1" stopColor={barColor} stopOpacity={barGradientEndOpacity} />
        </SvgLinearGradient>
      </Defs>
      {yTicks.map((tick) => {
        const y = top + (1 - tick / maxValue) * plotHeight;
        return (
          <SvgText
            fill="#54555A"
            fontSize="10"
            key={tick}
            textAnchor="end"
            x={left - 12}
            y={y + 3}>
            {tick}
          </SvgText>
        );
      })}
      <Line x1={left} x2={left} y1={top} y2={top + plotHeight} stroke="#D9D9D9" strokeWidth={1} />
      <Line
        x1={left}
        x2={left + plotWidth}
        y1={top + plotHeight}
        y2={top + plotHeight}
        stroke="#D9D9D9"
        strokeWidth={1}
      />
      {isBarChart &&
        points.map((point, index) => {
          const barY = Math.min(top + plotHeight, point.y + (card.barTopGap ?? 0));
          const barHeight = top + plotHeight - barY;
          return (
            <Rect
              fill={`url(#${gradientId})`}
              height={Math.max(0, barHeight)}
              key={`${card.title}-bar-${index}`}
              opacity={0.75}
              rx={3}
              width={10}
              x={point.x - 5}
              y={barY}
            />
          );
        })}
      <Path
        d={`${points
          .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
          .join(' ')} L${points[points.length - 1].x} ${top + plotHeight} L${points[0].x} ${top + plotHeight} Z`}
        fill={accent}
        opacity={card.type === 'stress-breathwork' || card.type === 'sleep-stress' ? 0.05 : 0}
      />
      <Polyline
        fill="none"
        points={polylinePoints}
        stroke={lineColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      />
      {points.map((point, index) => (
        <Circle
          cx={point.x}
          cy={point.y}
          fill={lineColor}
          key={`${card.title}-point-${index}`}
          r={4}
        />
      ))}
      {labels.map((label, index) => {
        if (!visibleLabelIndices.has(index)) return null;
        const lines = splitChartLabel(label);
        const baseX = left + index * labelStep;
        const x = index === 0 ? baseX - 5 : index === labels.length - 1 ? baseX + 5 : baseX;
        const textAnchor = index === 0 ? 'start' : index === labels.length - 1 ? 'end' : 'middle';

        return lines.map((line, lineIndex) => (
          <SvgText
            fill="#54555A"
            fontSize={line.length > 9 ? '8' : '9'}
            key={`${card.title}-label-${label}-${index}-${lineIndex}`}
            textAnchor={textAnchor}
            x={x}
            y={chartHeight - 27 + lineIndex * 12}>
            {line}
          </SvgText>
        ));
      })}
      {!!card.stat && (
        <>
          <Rect
            fill={`${accent}14`}
            height={statBubbleHeight}
            rx={statBubbleHeight / 2}
            width={statBubbleWidth}
            x={statBubbleX}
            y={statBubbleY}
          />
          <SvgText
            fill={accent}
            fontSize="12"
            fontWeight="700"
            textAnchor="middle"
            x={statBubbleX + statBubbleWidth / 2}
            y={statBubbleY + 16}>
            {card.stat}
          </SvgText>
        </>
      )}
    </Svg>
  );
}

export default function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedCharts, setExpandedCharts] = useState<Record<string, boolean>>({});
  const {
    error,
    isLoading,
    isRefreshing,
    progress,
    loadProgressIfNeeded,
    refreshProgress,
    silentRefresh,
    setSelectedChartType,
  } = useProgress();
  const scores = progress?.metrics ?? [];
  const chartCards = (progress?.charts ?? []).map(getChartVisual);
  const hasProgressData = Boolean(progress && (scores.length || chartCards.length || progress.summary));
  const toggleChart = useCallback((chartType: string) => {
    setExpandedCharts((current) => ({
      ...current,
      [chartType]: !current[chartType],
    }));
  }, []);

  // Stable refs so the useFocusEffect callback never needs to change identity
  const loadRef = useRef(loadProgressIfNeeded);
  const silentRef = useRef(silentRefresh);
  loadRef.current = loadProgressIfNeeded;
  silentRef.current = silentRefresh;
  const hasFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocused.current) {
        hasFocused.current = true;
        void loadRef.current();   // first focus: show loading spinner
      } else {
        void silentRef.current(); // return visits: silent background refresh
      }
    }, [])
  );

  return (
    <SwipeTabsWrapper>
      <View style={styles.screen}>
        <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 250 }]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshProgress} tintColor="#3770FC" />
          }
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Insights</Text>
            <Text style={styles.subtitle}>Understanding Your Patterns</Text>
          </View>

          <View style={styles.weekPanel}>
            <View style={styles.weekCard}>
              <Image source={thisWeekBackground} style={styles.weekCardImage} contentFit="cover" />
              <LinearGradient
                colors={['rgb(255,255,255)', 'rgb(255,255,255)', 'rgba(255,255,255,0)']}
                locations={[0, 0.52, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.weekCardOverlay}
              />
              <View style={styles.weekHeader}>
                <View style={styles.weekIcon}>
                  <Image source={thisWeekIcon} style={styles.weekIconImage} contentFit="contain" />
                </View>
                <View style={styles.weekTitleWrap}>
                  <Text adjustsFontSizeToFit numberOfLines={1} style={styles.weekTitle}>This Week</Text>
                </View>
              </View>
              <Text style={styles.weekText}>{progress?.summary}</Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#3770FC" />
              <Text style={styles.stateText}>Loading progress...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Unable to load progress</Text>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable onPress={refreshProgress} style={styles.retryButton}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : !hasProgressData ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>No progress yet</Text>
              <Text style={styles.stateText}>Your insights will appear here once progress data is available.</Text>
            </View>
          ) : (
            <>
              <View style={styles.scoreRow}>
                {scores.map((score, index) => (
                  <ScoreCircle index={index} key={score.label} score={score} />
                ))}
              </View>

              <View style={styles.chartGrid}>
                {chartCards.map((card) => {
                  const icon = getChartIcon(card);
                  const isExpanded = Boolean(expandedCharts[card.type]);

                  return (
              <View key={card.title} style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <View style={[styles.chartIcon, { backgroundColor: `${card.themeColor}1A` }]}>
                    {icon.iconAsset ? (
                      <Image
                        source={icon.iconAsset}
                        style={[styles.chartIconImage, { tintColor: card.themeColor }]}
                        contentFit="contain"
                      />
                    ) : (
                      <Ionicons color={card.themeColor} name={icon.iconName ?? 'ellipse-outline'} size={20} />
                    )}
                  </View>
                  <View style={styles.chartHeaderText}>
                    <Text style={styles.chartTitle}>{card.title}</Text>
                    <Text style={styles.chartSubtitle}>{card.subtitle}</Text>
                  </View>
                  <Pressable
                    accessibilityLabel={`${isExpanded ? 'Hide' : 'Show'} ${card.title} chart`}
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => toggleChart(card.type)}
                    style={({ pressed }) => [
                      styles.chartToggle,
                      { backgroundColor: `${card.themeColor}14` },
                      pressed && styles.chartTogglePressed,
                    ]}>
                    <Ionicons
                      color={card.themeColor}
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={22}
                    />
                  </Pressable>
                </View>
                {isExpanded ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedChartType(card.type);
                      router.push({
                        pathname: '/insight-details',
                        params: { type: card.type },
                      });
                    }}
                    style={({ pressed }) => [styles.chartPlot, pressed && styles.chartCardPressed]}>
                    <ValueChart card={card} />
                  </Pressable>
                ) : null}
              </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
        </SafeAreaView>
      </View>
    </SwipeTabsWrapper>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    minHeight: 104,
    paddingBottom: 16,
    paddingHorizontal: 18,
    paddingTop: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    width: '100%',
  },
  chartCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  chartGrid: {
    gap: 12,
    marginTop: 40,
    width: '100%',
  },
  chartDays: {
    color: '#54555A',
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 8,
    fontWeight: '400',
    lineHeight: 12,
  },
  chartFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: -2,
  },
  chartHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  chartHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  chartIcon: {
    alignItems: 'center',
    borderRadius: 24,
    flexShrink: 0,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  chartIconImage: {
    height: 26,
    width: 26,
  },
  chartPlot: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginTop: 12,
    overflow: 'visible',
    width: '100%',
    zIndex: 3,
  },
  chartSvgOverflow: {
    overflow: 'visible',
  },
  chartSubtitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
  },
  chartStat: {
    fontFamily: AppFonts.sansBold,
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 12,
  },
  chartTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansBold,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    flexShrink: 1,
  },
  chartToggle: {
    alignItems: 'center',
    borderRadius: 22,
    flexShrink: 0,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  chartTogglePressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  content: {
    paddingHorizontal: 17,
    paddingTop: 64,
  },
  header: {
    marginBottom: 20,
  },
  safeArea: {
    flex: 1,
  },
  scoreCenter: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  scoreIcon: {
    alignItems: 'center',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#FF0059',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    top: -10,
    width: 30,
    zIndex: 2,
  },
  scoreIconImage: {
    height: 16,
    width: 16,
  },
  scoreItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 132,
    justifyContent: 'center',
    position: 'relative',
    width: '48%',
  },
  scoreLabel: {
    color: '#173F5F',
    fontFamily: AppFonts.sansRegular,
    fontSize: 8,
    fontWeight: '400',
    lineHeight: 12,
  },
  scoreMeta: {
    fontFamily: AppFonts.sansRegular,
    fontSize: 8,
    fontWeight: '400',
    lineHeight: 10,
  },
  scoreRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 12,
    rowGap: 20,
    marginTop: 16,
    zIndex: 2,
  },
  scoreValue: {
    color: '#000000',
    fontFamily: AppFonts.displayMedium,
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 26,
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: '#3770FC',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  screen: {
    backgroundColor: '#F1F3FC',
    flex: 1,
    overflow: 'hidden',
  },
  subtitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    gap: 8,
    marginTop: -76,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    zIndex: 2,
  },
  stateText: {
    color: '#6F7484',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  stateTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 42,
  },
  weekCard: {
    alignSelf: 'stretch',
    borderRadius: 16,
    minHeight: 116,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 18,
    position: 'relative',
    width: '100%',
  },
  weekCardImage: {
    borderRadius: 16,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  weekCardOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: '74%',
  },
  weekPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255,255,255,0.72)',
    borderRadius: 20,
    borderWidth: 2,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    width: '100%',
  },
  weekHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  weekIcon: {
    alignItems: 'center',
    backgroundColor: '#7B61FF',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    width: 30,
  },
  weekIconImage: {
    height: 16,
    tintColor: '#FFFFFF',
    width: 16,
  },
  weekText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 20,
    maxWidth: '56%',
  },
  weekTitleWrap: {
    flex: 1,
  },
  weekTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 30,
  },
});
