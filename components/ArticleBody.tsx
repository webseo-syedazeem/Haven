import { StyleSheet, Text, View } from 'react-native';

import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'paragraph'; text: string };

/**
 * Help articles and the legal screens are authored as plain markdown-ish text.
 * Rather than pull in a markdown renderer for headings, bullets and paragraphs,
 * this walks the lines and lays them out with the app's own type scale.
 *
 * Supported: `#`/`##`/`###` headings, `-`/`*`/`•` bullets, and blank-line
 * separated paragraphs. Inline `**bold**` markers are stripped rather than
 * styled, so authored copy never leaks asterisks into the UI.
 */
function parse(body: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (!paragraph.length) return;
    blocks.push({ type: 'paragraph', text: clean(paragraph.join(' ')) });
    paragraph = [];
  };

  for (const rawLine of (body ?? '').split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      flush();
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        text: clean(heading[2]),
      });
      continue;
    }

    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      flush();
      blocks.push({ type: 'bullet', text: clean(bullet[1]) });
      continue;
    }

    paragraph.push(line);
  }

  flush();
  return blocks;
}

function clean(text: string): string {
  return text.replace(/\*\*/g, '').replace(/__/g, '').trim();
}

export function ArticleBody({ body }: { body: string }) {
  const blocks = parse(body);

  if (!blocks.length) {
    return <Text style={styles.paragraph}>This article has no content yet.</Text>;
  }

  return (
    <View>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Text
              key={index}
              style={[
                styles.heading,
                block.level === 1 && styles.heading1,
                block.level === 3 && styles.heading3,
                index === 0 && styles.headingFirst,
              ]}>
              {block.text}
            </Text>
          );
        }

        if (block.type === 'bullet') {
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{block.text}</Text>
            </View>
          );
        }

        return (
          <Text key={index} style={styles.paragraph}>
            {block.text}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.playfairRegular,
    fontSize: 21,
    letterSpacing: -0.2,
    lineHeight: 28,
    marginBottom: 6,
    marginTop: 22,
  },
  heading1: {
    fontSize: 28,
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  heading3: {
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 24,
  },
  headingFirst: {
    marginTop: 0,
  },
  paragraph: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  bulletDot: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    marginRight: 10,
  },
  bulletText: {
    color: HalcyonColors.textSecondary,
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
  },
});
