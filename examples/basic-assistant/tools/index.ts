/**
 * Basic Assistant — Custom Tools
 *
 * These tools extend the agent's capabilities beyond the built-in OpenClaw tools.
 * They are compiled into an OpenClaw Plugin by `clawkit build`.
 */

import type { ToolDefinition } from '@openclaw-kit/core';
import { wordCountTool } from './word-count.js';
import { timestampTool } from './timestamp.js';

/**
 * All custom tools for the Basic Assistant application.
 */
export const tools: ToolDefinition[] = [wordCountTool, timestampTool];

export default function register(api: { registerTool: (name: string, spec: unknown) => void }) {
  for (const tool of tools) {
    api.registerTool(tool.name, tool);
  }
}
