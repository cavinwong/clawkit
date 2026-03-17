/**
 * Timestamp Tool
 *
 * Provides timezone-aware date and time formatting utilities.
 * Useful for scheduling, logging, and time calculations.
 */

import { Tool, Field } from '@clawkit/core';

export const timestampTool = Tool.define({
  name: 'timestamp',
  description:
    'Get the current date and time, convert between timezones, or format timestamps. ' +
    'Use this for scheduling tasks, logging events, or answering time-related questions.',
  schema: {
    action: Field.enum('The action to perform', [
      'now',
      'format',
      'convert',
    ]).default('now'),
    timezone: Field.string(
      'IANA timezone name (e.g. "America/New_York", "Asia/Shanghai", "Europe/London")',
    )
      .optional()
      .default('UTC'),
    timestamp: Field.string(
      'ISO 8601 timestamp to format or convert (required for format/convert actions)',
    ).optional(),
    format: Field.enum('Output format', [
      'iso',
      'human',
      'date-only',
      'time-only',
      'relative',
    ]).default('human'),
  },
  async execute({ action, timezone, timestamp, format }) {
    const tz = timezone ?? 'UTC';

    if (action === 'now') {
      const now = new Date();
      return formatDate(now, tz, format ?? 'human');
    }

    if (action === 'format' || action === 'convert') {
      if (!timestamp) {
        return { text: 'Error: timestamp is required for format/convert actions', success: false };
      }
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return { text: `Error: invalid timestamp "${timestamp}"`, success: false };
      }
      return formatDate(date, tz, format ?? 'human');
    }

    return { text: `Unknown action: ${String(action)}`, success: false };
  },
});

function formatDate(
  date: Date,
  timezone: string,
  format: string,
): string {
  try {
    switch (format) {
      case 'iso':
        return date.toISOString();

      case 'date-only':
        return date.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD

      case 'time-only':
        return date.toLocaleTimeString('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

      case 'relative': {
        const now = Date.now();
        const diff = now - date.getTime();
        const abs = Math.abs(diff);
        const future = diff < 0;
        const prefix = future ? 'in ' : '';
        const suffix = future ? '' : ' ago';

        if (abs < 60_000) return `${prefix}${Math.round(abs / 1000)} seconds${suffix}`;
        if (abs < 3_600_000) return `${prefix}${Math.round(abs / 60_000)} minutes${suffix}`;
        if (abs < 86_400_000) return `${prefix}${Math.round(abs / 3_600_000)} hours${suffix}`;
        return `${prefix}${Math.round(abs / 86_400_000)} days${suffix}`;
      }

      case 'human':
      default:
        return date.toLocaleString('en-US', {
          timeZone: timezone,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        });
    }
  } catch {
    return `Error: invalid timezone "${timezone}"`;
  }
}
