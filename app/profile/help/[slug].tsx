import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ArticleBody } from '@/components/ArticleBody';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { SettingsScreen } from '@/components/SettingsScreen';
import { PassageColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useHelpArticle } from '@/hooks/useHelp';
import { formatHelpCategory } from '@/lib/api/help';

/** One published help article, from `GET /api/help/:slug`. */
export default function HelpArticleScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { data: article, isInitialLoading, isError, error, refetch } = useHelpArticle(slug);

  // A missing slug comes back as a 404, which reaches us as an error message
  // rather than an empty result — treat it as "not found", not a connection
  // problem, so the copy matches what happened.
  const notFound =
    isError && /not found/i.test(error instanceof Error ? error.message : String(error ?? ''));

  const renderBody = () => {
    if (isInitialLoading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={PassageColors.accent} />
        </View>
      );
    }

    if (notFound || (!article && !isError)) {
      return (
        <EmptyState
          actionLabel="Back to Help Centre"
          icon="document-outline"
          message="It may have been unpublished since this link was made."
          onAction={() => router.back()}
          title="We can't find that article"
        />
      );
    }

    if (isError || !article) {
      return <ErrorState onRetry={() => void refetch()} />;
    }

    return (
      <>
        {!!article.category && (
          <Text style={styles.category}>{formatHelpCategory(article.category)}</Text>
        )}
        <ArticleBody body={article.body} />

        <View style={styles.support}>
          <SettingsGroup
            footnote="We usually reply within a couple of days."
            title="Did this help?">
            <SettingsRow
              icon="chatbubble-ellipses-outline"
              label="Contact Support"
              onPress={() => router.push('/profile/contact-support')}
            />
          </SettingsGroup>
        </View>
      </>
    );
  };

  return (
    <SettingsScreen
      backgroundImage={require('@/assets/images/help-ocean-coast-v2.webp')}
      title={article?.title ?? 'Help'}>
      {renderBody()}
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 64,
  },
  category: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.6,
    lineHeight: 16,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  support: {
    marginTop: 34,
  },
});
