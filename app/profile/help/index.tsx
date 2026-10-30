import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { EmptyState, ErrorState } from '@/components/EmptyState';
import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { SettingsScreen } from '@/components/SettingsScreen';
import { PassageColors, PassageRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useFilteredHelpArticles, useHelpArticles } from '@/hooks/useHelp';
import { formatHelpCategory } from '@/lib/api/help';

/**
 * R-09. `GET /api/help` returns every published article grouped by category in
 * one call, so the search box filters what is already here rather than asking
 * the server again — there is no help search endpoint.
 */
export default function HelpCentreScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const { data: categories, isInitialLoading, isError, refetch } = useHelpArticles();
  const filtered = useFilteredHelpArticles(categories, query);

  const hasAnyArticles = (categories ?? []).some((entry) => entry.articles.length > 0);

  const renderList = () => {
    if (isInitialLoading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={PassageColors.accent} />
        </View>
      );
    }

    if (isError) {
      return <ErrorState onRetry={() => void refetch()} />;
    }

    if (!hasAnyArticles) {
      return (
        <EmptyState
          icon="book-outline"
          message="Help articles are on their way. In the meantime, send us a message and we will answer directly."
          title="Nothing here yet"
        />
      );
    }

    if (!filtered.length) {
      return (
        <EmptyState
          actionLabel="Clear search"
          icon="search-outline"
          message={`Nothing matches “${query.trim()}”.`}
          onAction={() => setQuery('')}
          title="No articles found"
        />
      );
    }

    return filtered.map((entry) => (
      <SettingsGroup key={entry.category} title={formatHelpCategory(entry.category)}>
        {entry.articles.map((article) => (
          <SettingsRow
            key={article.slug}
            label={article.title}
            onPress={() => router.push(`/profile/help/${article.slug}` as Href)}
          />
        ))}
      </SettingsGroup>
    ));
  };

  return (
    <SettingsScreen
      backgroundImage={require('@/assets/images/help-ocean-coast-v2.webp')}
      scrollingBackground
      subtitle="Answers to the things people ask most."
      title="Help Centre">
      <View style={styles.searchBar}>
        <Ionicons color={PassageColors.textSecondary} name="search-outline" size={18} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search help"
          placeholderTextColor={PassageColors.textSecondary}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
        {!!query && (
          <Pressable
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setQuery('')}>
            <Ionicons color={PassageColors.textSecondary} name="close-circle" size={17} />
          </Pressable>
        )}
      </View>

      {renderList()}

      <SettingsGroup
        footnote="We usually reply within a couple of days."
        title="Still stuck?">
        <SettingsRow
          icon="chatbubble-ellipses-outline"
          label="Contact Support"
          onPress={() => router.push('/profile/contact-support')}
        />
        <SettingsRow
          icon="alert-circle-outline"
          label="Report a problem"
          onPress={() => router.push('/profile/report-problem')}
        />
        <SettingsRow
          icon="sparkles-outline"
          label="Request a soundscape"
          onPress={() => router.push('/profile/request-soundscape')}
        />
      </SettingsGroup>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    alignItems: 'center',
    backgroundColor: PassageColors.surface,
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.pill,
    borderWidth: 1,
    columnGap: 10,
    flexDirection: 'row',
    marginBottom: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  searchInput: {
    color: PassageColors.textPrimary,
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 20,
    padding: 0,
  },
  loading: {
    paddingVertical: 64,
  },
});
