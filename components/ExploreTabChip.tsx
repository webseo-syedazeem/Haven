import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ExploreGradientFill } from '@/components/explore-gradient';
import { AppFonts } from '@/constants/theme';

type ExploreTabChipProps = PressableProps & {
  label: string;
  active: boolean;
  variant?: 'tab' | 'subtab' | 'chip' | 'pill';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ExploreTabChip({
  label,
  active,
  variant = 'tab',
  icon,
  style,
  onPress,
  ...props
}: ExploreTabChipProps) {
  const isSubtab = variant === 'subtab';
  const isChip = variant === 'chip';
  const isPill = variant === 'pill';
  const innerRadius = isSubtab ? 10 : isChip ? 12 : isPill ? 18 : 24;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.outer,
        variant === 'tab' && styles.tabOuter,
        isSubtab && styles.subtabOuter,
        isChip && styles.chipOuter,
        isPill && styles.pillOuter,
        active && styles.activeOuter,
        pressed && styles.pressed,
        style,
      ]}
      {...props}>
      <View style={[
        styles.inner,
        { borderRadius: innerRadius },
        isChip && styles.chipInner,
        isPill && styles.pillInner,
      ]}>
        {active && <ExploreGradientFill borderRadius={innerRadius} />}
        {!active && isPill && <View style={[StyleSheet.absoluteFillObject, styles.pillInactiveBg, { borderRadius: innerRadius }]} />}
        <View style={[
          styles.content,
          isChip && styles.chipContentWrapper,
          isSubtab && styles.subtabContent,
          isChip && styles.chipContent,
          isChip && active && styles.chipContentActive,
          isPill && styles.pillContent,
        ]}>
          {icon}
          <Text
            numberOfLines={isChip || isPill ? 1 : 2}
            style={[
              styles.label,
              active && styles.labelActive,
              isChip && styles.chipLabel,
              active && isChip && styles.chipLabelActive,
              isPill && styles.pillLabel,
              active && isPill && styles.pillLabelActive,
            ]}>
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
  tabOuter: {
    borderRadius: 24,
    flex: 1,
    minHeight: 40,
  },
  subtabOuter: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    elevation: 3,
    minHeight: 62,
    minWidth: 104,
    padding: 5,
    shadowColor: '#5275E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  chipOuter: {
    alignSelf: 'stretch',
    width: '48.5%',
  },
  pillOuter: {
    borderRadius: 18,
    flex: 0,
    minHeight: 34,
  },
  activeOuter: {
    elevation: 6,
    shadowColor: 'rgb(110, 95, 230)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  inner: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  chipInner: {
    flex: 0,
  },
  pillInner: {
    flex: 0,
  },
  pillInactiveBg: {
    backgroundColor: '#F4F5FA',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative',
    zIndex: 1,
  },
  subtabContent: {
    flexDirection: 'row',
    gap: 9,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipContentWrapper: {
    alignItems: 'stretch',
    flex: 0,
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  chipContent: {
    backgroundColor: '#F7F7F7',
    borderColor: '#E5E5EA',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  chipContentActive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  pillContent: {
    flex: 0,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  label: {
    color: '#54555A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  labelActive: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  chipLabel: {
    color: '#8C8C8C',
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'left',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  pillLabel: {
    color: '#54555A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  pillLabelActive: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
  },
});
