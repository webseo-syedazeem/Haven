import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HalcyonColors, HalcyonRadius, HalcyonSpacing } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import type { Playlist, PlaylistPayload } from '@/lib/api/playlists';

type PlaylistFormSheetProps = {
  visible: boolean;
  /** Present when editing; absent when creating. */
  playlist?: Playlist | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: PlaylistPayload) => void | Promise<void>;
};

/** S-05 — create or rename a playlist. Name required, the rest optional. */
export function PlaylistFormSheet({
  visible,
  playlist,
  busy = false,
  onClose,
  onSubmit,
}: PlaylistFormSheetProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(playlist?.name ?? '');
    setDescription(playlist?.description ?? '');
    setCoverUrl(playlist?.cover_image_url ?? '');
    setError(null);
  }, [playlist, visible]);

  const handleSubmit = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Give the playlist a name.');
      return;
    }

    await onSubmit({
      name: cleanName,
      description: description.trim() || null,
      cover_image_url: coverUrl.trim() || null,
    });
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.backdrop} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{playlist ? 'Edit playlist' : 'New playlist'}</Text>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}>
              <Ionicons color={HalcyonColors.textPrimary} name="close" size={22} />
            </Pressable>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            autoFocus
            maxLength={80}
            onChangeText={(value) => {
              setName(value);
              if (error) setError(null);
            }}
            placeholder="Evening wind-down"
            placeholderTextColor={HalcyonColors.textSecondary}
            returnKeyType="done"
            style={styles.input}
            value={name}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            maxLength={240}
            multiline
            onChangeText={setDescription}
            placeholder="Optional"
            placeholderTextColor={HalcyonColors.textSecondary}
            style={[styles.input, styles.multiline]}
            value={description}
          />

          <Text style={styles.label}>Cover image URL</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="url"
            onChangeText={setCoverUrl}
            placeholder="Optional"
            placeholderTextColor={HalcyonColors.textSecondary}
            style={styles.input}
            value={coverUrl}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            accessibilityLabel={playlist ? 'Save playlist' : 'Create playlist'}
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [
              styles.submit,
              pressed && styles.submitPressed,
              busy && styles.submitDisabled,
            ]}>
            {busy ? (
              <ActivityIndicator color={HalcyonColors.background} />
            ) : (
              <Text style={styles.submitLabel}>{playlist ? 'Save' : 'Create playlist'}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(4,4,6,0.62)',
    flex: 1,
  },
  sheet: {
    backgroundColor: HalcyonColors.surface,
    borderTopColor: HalcyonColors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 27,
  },
  label: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: HalcyonColors.surfaceRaised,
    borderColor: HalcyonColors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  error: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  submit: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.pill,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 50,
  },
  submitPressed: {
    backgroundColor: HalcyonColors.accentPressed,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
