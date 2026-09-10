import { Ionicons } from '@expo/vector-icons';
import { Children, Fragment, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

/** Muted, desaturated red — a warning, not an alarm. */
export const DESTRUCTIVE_COLOR = '#B4736B';

const SWITCH_TRACK_OFF = 'rgba(255,255,255,0.14)';

type SettingsRowProps = {
  label: string;
  /** Thin-line glyph on the left. Rows without one align to the same text edge. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Second line under the label, for the rule that is not obvious from the name. */
  description?: string;
  /** Right hand text on a value row, shown before the chevron. */
  value?: string;
  /** Turns the row into a toggle row; the row itself flips it when tapped. */
  toggle?: {
    value: boolean;
    onValueChange: (next: boolean) => void;
    disabled?: boolean;
  };
  onPress?: () => void;
  /** Muted red label and glyph, for delete and remove-all. */
  destructive?: boolean;
  disabled?: boolean;
  /** Chevron shows by default on a pressable row that is not a toggle. */
  showChevron?: boolean;
  /** Replaces the right hand side entirely — used by the account sync status. */
  accessory?: ReactNode;
  busy?: boolean;
};

/**
 * One grouped settings row: left glyph, label, and a chevron, value, toggle or
 * custom accessory on the right. Every settings screen builds from this so the
 * rows are identical everywhere rather than re-styled per screen.
 */
export function SettingsRow({
  label,
  icon,
  description,
  value,
  toggle,
  onPress,
  destructive = false,
  disabled = false,
  showChevron,
  accessory,
  busy = false,
}: SettingsRowProps) {
  const isToggle = !!toggle;
  const pressable = !disabled && (!!onPress || isToggle);
  const chevron = showChevron ?? (!!onPress && !isToggle && !accessory);
  const tint = destructive ? DESTRUCTIVE_COLOR : HalcyonColors.textPrimary;

  const handlePress = () => {
    if (disabled) return;
    if (onPress) {
      onPress();
      return;
    }
    if (toggle && !toggle.disabled) toggle.onValueChange(!toggle.value);
  };

  const body = (
    <>
      {!!icon && (
        <Ionicons
          color={destructive ? DESTRUCTIVE_COLOR : HalcyonColors.textSecondary}
          name={icon}
          size={19}
          style={styles.icon}
        />
      )}

      <View style={styles.copy}>
        <Text style={[styles.label, { color: tint }]}>{label}</Text>
        {!!description && <Text style={styles.description}>{description}</Text>}
      </View>

      {busy && <ActivityIndicator color={HalcyonColors.accent} size="small" />}

      {!busy && accessory}

      {!busy && !accessory && !!value && (
        <Text numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      )}

      {!busy && isToggle && (
        <Switch
          disabled={disabled || toggle.disabled}
          ios_backgroundColor={SWITCH_TRACK_OFF}
          onValueChange={toggle.onValueChange}
          thumbColor="#FFFFFF"
          trackColor={{ false: SWITCH_TRACK_OFF, true: HalcyonColors.accent }}
          value={toggle.value}
        />
      )}

      {!busy && chevron && (
        <Ionicons
          color={destructive ? DESTRUCTIVE_COLOR : HalcyonColors.textSecondary}
          name="chevron-forward"
          size={16}
          style={styles.chevron}
        />
      )}
    </>
  );

  if (!pressable) {
    return (
      <View accessibilityLabel={label} style={[styles.row, disabled && styles.rowDisabled]}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={isToggle ? 'switch' : 'button'}
      accessibilityState={isToggle ? { checked: toggle.value } : undefined}
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {body}
    </Pressable>
  );
}

type SettingsGroupProps = {
  /** Small muted caption above the card. */
  title?: string;
  /** Muted explainer under the card. */
  footnote?: string;
  children: ReactNode;
};

/** The card the rows sit in, with a hairline between each one. */
export function SettingsGroup({ title, footnote, children }: SettingsGroupProps) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.group}>
      {!!title && <Text style={styles.groupTitle}>{title}</Text>}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 && <View style={styles.divider} />}
            {row}
          </Fragment>
        ))}
      </View>
      {!!footnote && <Text style={styles.footnote}>{footnote}</Text>}
    </View>
  );
}

/** A right hand status pill, e.g. "Synced" with a cloud-check. */
export function SettingsStatus({
  label,
  icon = 'cloud-done-outline',
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.status}>
      <Ionicons color={HalcyonColors.accent} name={icon} size={15} />
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 22,
  },
  groupTitle: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.6,
    lineHeight: 16,
    marginBottom: 9,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: {
    backgroundColor: HalcyonColors.border,
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  footnote: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 9,
    paddingHorizontal: 4,
  },
  row: {
    alignItems: 'center',
    columnGap: 12,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowPressed: {
    backgroundColor: HalcyonColors.surfaceRaised,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  icon: {
    width: 22,
  },
  copy: {
    flex: 1,
  },
  label: {
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
  },
  description: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  value: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 19,
    maxWidth: 150,
  },
  chevron: {
    marginLeft: -2,
  },
  status: {
    alignItems: 'center',
    columnGap: 6,
    flexDirection: 'row',
  },
  statusLabel: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
