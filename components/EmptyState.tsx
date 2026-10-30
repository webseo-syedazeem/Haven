import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PassageColors, PassageRadius, PassageSpacing, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** The shared "nothing here" block — a faint glyph, a line, and a way out. */
export function EmptyState({ icon, iconColor, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <Ionicons color={iconColor ?? PassageColors.skeleton} name={icon} size={64} />
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!actionLabel && !!onAction && (
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** The same block for a failed request, with a retry. */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      actionLabel={onRetry ? 'Try again' : undefined}
      icon="cloud-offline-outline"
      message={message ?? 'Check your connection and try again.'}
      onAction={onRetry}
      title="Couldn't load this"
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingHorizontal: PassageSpacing.screenX,
    paddingVertical: 56,
  },
  title: {
    ...Typography.sectionHeading,
    marginTop: 18,
    textAlign: 'center',
  },
  message: {
    ...Typography.muted,
    marginTop: 6,
    maxWidth: 280,
    textAlign: 'center',
  },
  action: {
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.pill,
    borderWidth: 1,
    marginTop: 22,
    paddingHorizontal: 24,
    paddingVertical: 11,
  },
  actionPressed: {
    opacity: 0.74,
  },
  actionLabel: {
    color: PassageColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
});
