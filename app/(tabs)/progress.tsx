import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
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
  if (card.type === 'movement-stress') {
    return { iconAsset: movementIcon, iconName: undefined };
  }

  if (card.type === 'sleep-mood') {
    return { iconAsset: windDownIcon, iconName: undefined };
  }

  if (card.type === 'temperature-stress') {
    return { iconAsset: undefined, iconName: 'checkmark-circle-outline' as const };
  }

  return { iconAsset: undefined, iconName: 'heart-outline' as const };
}

function getChartVisual(card: ProgressChartOverview): ChartCard {
  if (card.type === 'movement-stress') {
    return {
      ...card,
      barColor: '#0F8F24',
      barGradientStart: '#C8F7CE',
      barTopGap: 7,
      lineColor: '#5FEA6A',
    };
  }

  if (card.type === 'temperature-stress') {
    return {
      ...card,
      barColor: card.themeColor,
      barGradientStart: '#FFD5C8',
      barTopGap: 7,
      lineColor: '#FF8B68',
    };
  }

  return {
    ...card,
    lineColor: card.type === 'sleep-mood' ? '#A18EFF' : card.themeColor,
  };
}

function ScoreCircle({ index, score }: { index: number; score: Score }) {
  const size = 74;
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
  const chartWidth = 132;
  const chartHeight = 104;
  const left = 28;
  const right = 8;
  const top = 10;
  const bottom = 24;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;
  const values = card.data.length ? card.data : [0, 0];
  const labels = card.labels.length ? card.labels : values.map((_, index) => String(index + 1));
  const maxValue = Math.max(100, ...values);
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
  const visiblePointCount = Math.max(1, Math.min(labels.length, points.length));
  const visiblePoints = points.slice(0, visiblePointCount);
  const statBubbleWidth = 42;
  const statBubbleHeight = 24;
  const statBubbleGap = 10;
  const statBubbleEdgePadding = 2;
  const statPoint = visiblePoints[visiblePoints.length - 1] ?? points[points.length - 1];
  const statPreviousPoint = visiblePoints[Math.max(0, visiblePoints.length - 2)] ?? statPoint;
  const statBubbleX = Math.max(
    statBubbleEdgePadding,
    Math.min(
      chartWidth - statBubbleWidth - statBubbleEdgePadding,
      statPoint.x - statBubbleWidth / 2,
    ),
  );
  const statSafeLineY = Math.min(statPoint.y, statPreviousPoint.y);
  const statBubbleY = Math.max(
    statBubbleEdgePadding,
    statSafeLineY - statBubbleHeight - statBubbleGap,
  );

  return (
    <Svg height={chartHeight} width={chartWidth} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={barGradientStart} />
          <Stop offset="1" stopColor={barColor} stopOpacity={barGradientEndOpacity} />
        </SvgLinearGradient>
      </Defs>
      {[100, 75, 50, 25, 0].map((tick) => {
        const y = top + (1 - tick / 100) * plotHeight;
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
      {(card.type === 'movement-stress' || card.type === 'temperature-stress') &&
        points.slice(0, labels.length).map((point, index) => {
          const barY = Math.min(top + plotHeight, point.y + (card.barTopGap ?? 0));
          const barHeight = top + plotHeight - barY;
          return (
            <Rect
              fill={`url(#${gradientId})`}
              height={barHeight}
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
        opacity={card.type === 'stress-breathwork' || card.type === 'sleep-mood' ? 0.05 : 0}
      />
      <Polyline
        fill="none"
        points={polylinePoints}
        stroke={lineColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      />
      {visiblePoints.map((point, index) => (
        <Circle
          cx={point.x}
          cy={point.y}
          fill={lineColor}
          key={`${card.title}-point-${index}`}
          r={4}
        />
      ))}
      {labels.map((label, index) => (
        <SvgText
          fill="#54555A"
          fontSize="10"
          key={`${card.title}-label-${label}-${index}`}
          textAnchor="middle"
          x={left + index * labelStep}
          y={chartHeight - 6}>
          {label}
        </SvgText>
      ))}
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
  const {
    error,
    isLoading,
    isRefreshing,
    progress,
    loadProgressIfNeeded,
    refreshProgress,
    setSelectedChartType,
  } = useProgress();
  const scores = progress?.metrics ?? [];
  const chartCards = (progress?.charts ?? []).map(getChartVisual);
  const hasProgressData = Boolean(progress && (scores.length || chartCards.length || progress.summary));

  useEffect(() => {
    void loadProgressIfNeeded();
  }, [loadProgressIfNeeded]);

  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 132 }]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshProgress} tintColor="#3770FC" />
          }
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Insights</Text>
            <Text style={styles.subtitle}>Understanding Your Patterns</Text>
          </View>

          <View style={styles.weekPanel}>
            <ImageBackground
              source={thisWeekBackground}
              resizeMode="cover"
              imageStyle={styles.weekCardImage}
              style={styles.weekCard}>
              <View style={styles.weekHeader}>
                <View style={styles.weekIcon}>
                  <Image source={thisWeekIcon} style={styles.weekIconImage} contentFit="contain" />
                </View>
                <Text style={styles.weekTitle}>This Week</Text>
              </View>
              <Text style={styles.weekText}>{progress?.summary}</Text>
            </ImageBackground>
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

                  return (
              <Pressable
                key={card.title}
                onPress={() => {
                  setSelectedChartType(card.type);
                  router.push({
                    pathname: '/insight-details',
                    params: { type: card.type },
                  });
                }}
                style={({ pressed }) => [
                  styles.chartCard,
                  pressed && styles.chartCardPressed,
                ]}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartHeaderText}>
                    <Text style={styles.chartTitle}>{card.title}</Text>
                    <Text style={styles.chartSubtitle}>{card.subtitle}</Text>
                  </View>
                  <View style={[styles.chartIcon, { backgroundColor: `${card.themeColor}1A` }]}>
                    {icon.iconAsset ? (
                      <Image
                        source={icon.iconAsset}
                        style={[styles.chartIconImage, { tintColor: card.themeColor }]}
                        contentFit="contain"
                      />
                    ) : (
                      <Ionicons color={card.themeColor} name={icon.iconName ?? 'ellipse-outline'} size={16} />
                    )}
                  </View>
                </View>
                <View style={styles.chartPlot}>
                  <ValueChart card={card} />
                </View>
              </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
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
    borderRadius: 12,
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 178,
    paddingBottom: 12,
    paddingHorizontal: 10,
    paddingTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
  },
  chartCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  chartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
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
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chartHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 2,
  },
  chartIcon: {
    alignItems: 'center',
    borderRadius: 14,
    flexShrink: 0,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  chartIconImage: {
    height: 16,
    width: 16,
  },
  chartPlot: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  chartSubtitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansRegular,
    fontSize: 8,
    fontWeight: '400',
    lineHeight: 12,
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
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    flexShrink: 1,
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
    top: -5,
    width: 30,
    zIndex: 2,
  },
  scoreIconImage: {
    height: 16,
    width: 16,
  },
  scoreItem: {
    alignItems: 'center',
    borderRadius: 12,
    height: 96,
    justifyContent: 'center',
    position: 'relative',
    width: 74,
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
    gap: 5,
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginTop: -90,
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
    backgroundColor: '#EEF0FF',
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
    borderRadius: 8,
    minHeight: 150,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 16,
    position: 'relative',
    alignSelf: 'stretch',
  },
  weekCardImage: {
    borderRadius: 8,
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  weekPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingBottom: 100,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
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
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 26,
    maxWidth: '100%',
  },
  weekTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 26,
  },
});
