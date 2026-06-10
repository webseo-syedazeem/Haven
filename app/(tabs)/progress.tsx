import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const backgroundImage = require('@/assets/images/tool-page-bg-image.png');
const thisWeekBackground = require('@/assets/images/this-week-box-background-img.png');
const thisWeekIcon = require('@/assets/images/this-week-icon.svg');

type Score = {
  accent: string;
  gradientStart: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconAsset?: number;
  iconBackground: string;
  iconColor: string;
  label: string;
  meta: string;
  value: string;
};

type ChartCard = {
  accent: string;
  chart: 'line' | 'barsLine' | 'bars';
  icon: keyof typeof Ionicons.glyphMap;
  labels: string[];
  stat: string;
  subtitle: string;
  title: string;
  values: number[];
};

const scores: Score[] = [
  {
    accent: '#FF0059',
    gradientStart: '#FF0059',
    icon: 'heart-outline',
    iconBackground: 'transparent',
    iconColor: '#FF0059',
    label: 'Heart Rate',
    meta: '+10%',
    value: '68',
  },
  {
    accent: '#6339FB',
    gradientStart: '#6339FB',
    iconAsset: require('@/assets/images/second-progress-icon.svg'),
    iconBackground: '#6D66FD',
    iconColor: '#FFFFFF',
    label: 'Breath %',
    meta: '+7%',
    value: '42',
  },
  {
    accent: '#018AFE',
    gradientStart: '#018AFE',
    iconAsset: require('@/assets/images/third-progress-icon.svg'),
    iconBackground: '#018AFE',
    iconColor: '#FFFFFF',
    label: 'Sleep',
    meta: '+5%',
    value: '7.6',
  },
  {
    accent: '#2EB668',
    gradientStart: '#2EB668',
    iconAsset: require('@/assets/images/forth-progress-icon.svg'),
    iconBackground: '#2EB668',
    iconColor: '#FFFFFF',
    label: 'Tasks',
    meta: '+4%',
    value: '81',
  },
];

const chartCards: ChartCard[] = [
  {
    accent: '#FF0059',
    chart: 'line',
    icon: 'heart-outline',
    labels: ['0', '15', '30', '45', '60', 'min'],
    stat: '20% less',
    subtitle: 'More Breathwork,\nLower Stress',
    title: 'Stress Vs Breathwork',
    values: [60, 100, 78, 28, 70, 50, 0],
  },
  {
    accent: '#28B92A',
    chart: 'barsLine',
    icon: 'leaf-outline',
    labels: ['0', '2k', '4k', '6k', '10k', 'min'],
    stat: '-45%',
    subtitle: 'More Movement is linkedin\nto lower stress',
    title: 'Movement Vs Stress',
    values: [110, 85, 85, 60, 35, 30, 15],
  },
  {
    accent: '#7B61FF',
    chart: 'bars',
    icon: 'moon-outline',
    labels: ['0', '2', '4', '6', '8', 'hr'],
    stat: '+7%',
    subtitle: 'Sleep moves gently upward.',
    title: 'Sleep VS mood',
    values: [44, 56, 48, 66, 74, 82],
  },
  {
    accent: '#FD5728',
    chart: 'bars',
    icon: 'thermometer-outline',
    labels: ['0', '1', '2', '3', '4', 'day'],
    stat: '-3%',
    subtitle: 'Better calm, warmer balance.',
    title: 'Temperature Vs Stress',
    values: [72, 68, 62, 58, 53, 49],
  },
];

function ScoreCircle({ score }: { score: Score }) {
  const size = 74;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * 0.28;
  const gradientId = `scoreGradient${score.gradientStart.replace('#', '')}`;
  const iconContent = score.iconAsset ? (
    <Image
      source={score.iconAsset}
      style={[styles.scoreIconImage, { tintColor: score.iconColor }]}
      contentFit="contain"
    />
  ) : (
    <Ionicons color={score.iconColor} name={score.icon ?? 'ellipse-outline'} size={16} />
  );

  return (
    <View style={styles.scoreItem}>
      {score.iconBackground === 'transparent' ? (
        <LinearGradient colors={['#FFFFFF', '#FF0059']} locations={[0, 1]} style={styles.scoreIcon}>
          {iconContent}
        </LinearGradient>
      ) : (
        <View style={[styles.scoreIcon, { backgroundColor: score.iconBackground }]}>
          {iconContent}
        </View>
      )}
      <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={score.gradientStart} />
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
        <Text style={[styles.scoreMeta, { color: score.accent }]}>{score.meta}</Text>
      </View>
    </View>
  );
}

function ValueChart({ card }: { card: ChartCard }) {
  const chartWidth = 170;
  const chartHeight = 132;
  const left = 32;
  const right = 12;
  const top = 10;
  const bottom = 28;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;
  const maxValue = Math.max(100, ...card.values);
  const step = plotWidth / (card.values.length - 1);
  const points = card.values.map((value, index) => ({
    x: left + index * step,
    y: top + (1 - value / maxValue) * plotHeight,
  }));
  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
  const gradientId = `chartFill${card.accent.replace('#', '')}`;
  const labelStep = plotWidth / (card.labels.length - 1);

  return (
    <Svg height={chartHeight} width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={card.accent} />
          <Stop offset="1" stopColor={card.accent} stopOpacity={0.18} />
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
            x={left - 7}
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
      {card.chart !== 'line' &&
        points.slice(0, card.labels.length).map((point, index) => {
          const barHeight = top + plotHeight - point.y;
          return (
            <Rect
              fill={`url(#${gradientId})`}
              height={barHeight}
              key={`${card.title}-bar-${index}`}
              opacity={0.75}
              rx={0}
              width={10}
              x={point.x - 5}
              y={point.y}
            />
          );
        })}
      <Path
        d={`${points
          .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
          .join(' ')} L${points[points.length - 1].x} ${top + plotHeight} L${points[0].x} ${top + plotHeight} Z`}
        fill={card.chart === 'line' ? card.accent : 'transparent'}
        opacity={card.chart === 'line' ? 0.05 : 0}
      />
      <Polyline
        fill="none"
        points={polylinePoints}
        stroke={card.accent}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      />
      {points.map((point, index) => (
        <Circle
          cx={point.x}
          cy={point.y}
          fill={card.accent}
          key={`${card.title}-point-${index}`}
          r={4}
        />
      ))}
      {card.labels.map((label, index) => (
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
      <Rect
        fill={`${card.accent}14`}
        height={26}
        rx={13}
        width={44}
        x={chartWidth - 54}
        y={top + plotHeight * 0.55}
      />
      <SvgText
        fill={card.accent}
        fontSize="12"
        fontWeight="700"
        textAnchor="middle"
        x={chartWidth - 32}
        y={top + plotHeight * 0.55 + 17}>
        {card.stat}
      </SvgText>
    </Svg>
  );
}

function MiniBarChart({ accent }: { accent: string }) {
  const heights = [28, 43, 22, 51, 36, 46, 31];
  const gradientId = `barGradient${accent.replace('#', '')}`;

  return (
    <Svg height={64} width="100%" viewBox="0 0 140 64">
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={accent} />
          <Stop offset="1" stopColor={accent} stopOpacity={0.3} />
        </SvgLinearGradient>
      </Defs>
      {heights.map((height, index) => (
        <Rect
          fill={`url(#${gradientId})`}
          height={height}
          key={`${height}-${index}`}
          rx={4}
          width={10}
          x={8 + index * 18}
          y={56 - height}
        />
      ))}
    </Svg>
  );
}

export default function ProgressScreen() {
  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
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
              <Text style={styles.weekText}>
                Your stress eased on days with more breathwork better sleep. and Steady movment
              </Text>
            </ImageBackground>
          </View>

          <View style={styles.scoreRow}>
            {scores.map((score) => (
              <ScoreCircle key={score.label} score={score} />
            ))}
          </View>

          <View style={styles.chartGrid}>
            {chartCards.map((card) => (
              <View
                key={card.title}
                style={[styles.chartCard, card.chart !== 'bars' && styles.chartCardLarge]}>
                <View style={styles.chartHeader}>
                  <View>
                    <Text style={styles.chartTitle}>{card.title}</Text>
                    <Text style={styles.chartSubtitle}>{card.subtitle}</Text>
                  </View>
                  <View style={[styles.chartIcon, { backgroundColor: `${card.accent}1A` }]}>
                    <Ionicons color={card.accent} name={card.icon} size={16} />
                  </View>
                </View>
                {card.chart === 'bars' ? (
                  <>
                    <MiniBarChart accent={card.accent} />
                    <View style={styles.chartFooter}>
                      <Text style={styles.chartDays}>1   3   14   30   60   90 min</Text>
                      <Text style={[styles.chartStat, { color: card.accent }]}>{card.stat}</Text>
                    </View>
                  </>
                ) : (
                  <ValueChart card={card} />
                )}
              </View>
            ))}
          </View>
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
    minHeight: 148,
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
  },
  chartCardLarge: {
    minHeight: 240,
    padding: 14,
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
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chartIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  chartSubtitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansRegular,
    fontSize: 9,
    fontWeight: '400',
    lineHeight: 13,
    maxWidth: 112,
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
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  content: {
    paddingBottom: 112,
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
    lineHeight: 18,
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
    width: '100%',
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
    maxWidth: 260,
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
