/**
 * Word Count Tool
 *
 * Counts words, characters, sentences, and estimated reading time
 * for a given text. Useful for writing and editing tasks.
 */

import { Tool, Field } from '@clawkit/core';

export const wordCountTool = Tool.define({
  name: 'word_count',
  description:
    'Count words, characters, sentences, and estimate reading time for a given text. ' +
    'Use this when the user asks about document length or reading time.',
  schema: {
    text: Field.string('The text to analyze'),
    wordsPerMinute: Field.number('Average reading speed in words per minute')
      .min(50)
      .max(1000)
      .default(200),
  },
  async execute({ text, wordsPerMinute }) {
    const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;
    const charCount = text.length;
    const charCountNoSpaces = text.replace(/\s/g, '').length;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0).length;
    const readingTimeMinutes = wordCount / wordsPerMinute;
    const readingTimeFormatted =
      readingTimeMinutes < 1
        ? `${Math.round(readingTimeMinutes * 60)} seconds`
        : `${Math.round(readingTimeMinutes)} minute${Math.round(readingTimeMinutes) !== 1 ? 's' : ''}`;

    return [
      `**Text Analysis**`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Words | ${wordCount.toLocaleString()} |`,
      `| Characters (with spaces) | ${charCount.toLocaleString()} |`,
      `| Characters (no spaces) | ${charCountNoSpaces.toLocaleString()} |`,
      `| Sentences | ${sentences.toLocaleString()} |`,
      `| Paragraphs | ${paragraphs.toLocaleString()} |`,
      `| Est. reading time | ${readingTimeFormatted} |`,
    ].join('\n');
  },
});
