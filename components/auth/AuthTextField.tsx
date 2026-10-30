import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { PassageColors, PassageRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type AuthTextFieldProps = Omit<TextInputProps, 'style'> & {
  error?: boolean;
  errorMessage?: string;
  label?: string;
  onToggleSecureText?: () => void;
  secureTextVisible?: boolean;
  trailingIcon?: IconName;
};

export function AuthTextField({
  error = false,
  errorMessage,
  label,
  onToggleSecureText,
  secureTextVisible = false,
  trailingIcon,
  ...inputProps
}: AuthTextFieldProps) {
  const secureIcon = secureTextVisible ? 'eye-off-outline' : 'eye-outline';

  return (
    <View style={styles.group}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, (error || errorMessage) && styles.fieldError]}>
        <TextInput
          {...inputProps}
          placeholderTextColor={inputProps.placeholderTextColor ?? PassageColors.textSecondary}
          selectionColor={PassageColors.accent}
          style={[styles.input, (onToggleSecureText || trailingIcon) && styles.inputWithIcon]}
        />
        {onToggleSecureText ? (
          <Pressable
            accessibilityLabel={secureTextVisible ? 'Hide password' : 'Show password'}
            hitSlop={8}
            onPress={onToggleSecureText}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={PassageColors.textSecondary} name={secureIcon} size={19} />
          </Pressable>
        ) : trailingIcon ? (
          <View pointerEvents={'none'} style={styles.iconButton}>
            <Ionicons color={PassageColors.textSecondary} name={trailingIcon} size={19} />
          </View>
        ) : null}
      </View>
      {errorMessage ? (
        <Text accessibilityLiveRegion={'polite'} style={styles.errorMessage}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    backgroundColor: PassageColors.surface,
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.artwork,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
  },
  fieldError: {
    borderColor: 'rgba(211,137,126,0.78)',
  },
  errorMessage: {
    color: '#DFA196',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 4,
  },
  group: {
    rowGap: 7,
  },
  iconButton: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 0,
    width: 42,
  },
  input: {
    color: PassageColors.textPrimary,
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputWithIcon: {
    paddingRight: 52,
  },
  label: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  pressed: { opacity: 0.62 },
});
