import { Ionicons } from '@expo/vector-icons';
import { forwardRef, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

/** Web draws its own focus ring over the card border; the card is the affordance. */
const noFocusOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as never) : null;

type SettingsFieldProps = TextInputProps & {
  label: string;
  /** Validation returned for this exact field. */
  errorMessage?: string;
  /** Muted line under the field, for a rule the placeholder cannot carry. */
  hint?: string;
  /** Trailing control inside the card, e.g. a reveal-password eye. */
  accessory?: ReactNode;
  /** Grows the input for free text. */
  multiline?: boolean;
};

/**
 * A labelled input in the black opal card style, so every form in the profile
 * section — name, email, password, support messages — reads as one thing.
 */
export const SettingsField = forwardRef<TextInput, SettingsFieldProps>(function SettingsField(
  { label, hint, errorMessage, accessory, multiline = false, style, editable = true, ...inputProps },
  ref
) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, !editable && styles.cardReadOnly, !!errorMessage && styles.cardError]}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.row}>
          <TextInput
            editable={editable}
            placeholderTextColor={HalcyonColors.textSecondary}
            ref={ref}
            {...inputProps}
            multiline={multiline}
            style={[
              styles.input,
              multiline && styles.inputMultiline,
              !editable && styles.inputReadOnly,
              noFocusOutline,
              style,
            ]}
          />
          {accessory}
        </View>
      </View>
      {!!errorMessage && <Text style={styles.fieldError}>{errorMessage}</Text>}
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
});

/** The eye that reveals a password, styled for the dark card. */
export function RevealToggle({ shown, onPress }: { shown: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={shown ? 'Hide password' : 'Show password'}
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}>
      <Ionicons
        color={HalcyonColors.textSecondary}
        name={shown ? 'eye-off-outline' : 'eye-outline'}
        size={18}
      />
    </Pressable>
  );
}

/** Inline validation or request failure, in the accent rather than a red block. */
export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  card: {
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardReadOnly: {
    opacity: 0.8,
  },
  cardError: {
    borderColor: 'rgba(211,137,126,0.78)',
  },
  label: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.4,
    lineHeight: 16,
    marginBottom: 4,
  },
  row: {
    alignItems: 'center',
    columnGap: 12,
    flexDirection: 'row',
  },
  input: {
    color: HalcyonColors.textPrimary,
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 21,
    padding: 0,
  },
  inputMultiline: {
    minHeight: 108,
    paddingTop: 2,
    textAlignVertical: 'top',
  },
  inputReadOnly: {
    color: HalcyonColors.textSecondary,
  },
  hint: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 7,
    paddingHorizontal: 4,
  },
  error: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  fieldError: {
    color: '#DFA196',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 7,
    paddingHorizontal: 4,
  },
});
