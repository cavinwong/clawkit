/**
 * @clawkit/core - Core type definitions
 *
 * These types mirror and extend the OpenClaw configuration schema,
 * providing a strongly-typed foundation for ClawKit applications.
 */

import { z } from 'zod';

// ─────────────────────────────────────────────
// App Manifest Schema
// ─────────────────────────────────────────────

export const ChannelBindingSchema = z.object({
  /** The channel identifier (e.g. "whatsapp", "telegram", "discord") */
  channel: z.string(),
  /** Optional account ID for multi-account setups */
  accountId: z.string().optional(),
  /** Optional peer filter (direct message sender or group ID) */
  peer: z
    .object({
      kind: z.enum(['direct', 'group']),
      id: z.string(),
    })
    .optional(),
});

export type ChannelBinding = z.infer<typeof ChannelBindingSchema>;

export const ToolPolicySchema = z.object({
  /**
   * Base tool profile. Controls which tool groups are available by default.
   * - "minimal": session_status only
   * - "coding": fs + runtime + sessions + memory + image
   * - "messaging": messaging tools only
   * - "full": all tools (default)
   */
  profile: z.enum(['minimal', 'coding', 'messaging', 'full']).default('full'),
  /** Additional tools to allow beyond the profile */
  allow: z.array(z.string()).optional(),
  /** Tools to deny even if allowed by profile */
  deny: z.array(z.string()).optional(),
});

export type ToolPolicy = z.infer<typeof ToolPolicySchema>;

export const SandboxConfigSchema = z.object({
  /**
   * When to apply sandboxing.
   * - "off": no sandboxing (default)
   * - "non-main": sandbox group/channel sessions only
   * - "all": sandbox every session
   */
  mode: z.enum(['off', 'non-main', 'all']).default('off'),
  /** Sandbox backend */
  backend: z.enum(['docker', 'ssh', 'openshell']).default('docker'),
  /** Container scope */
  scope: z.enum(['session', 'agent', 'shared']).default('session'),
});

export type SandboxConfig = z.infer<typeof SandboxConfigSchema>;

export const AppManifestSchema = z.object({
  /** Application name (used as agentId in OpenClaw) */
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Name must be lowercase alphanumeric with hyphens'),

  /** Human-readable display name */
  displayName: z.string().min(1).max(128),

  /** Short description of the application */
  description: z.string().max(512),

  /** Semantic version of the application */
  version: z.string().regex(/^\d+\.\d+\.\d+/, 'Version must follow semver'),

  /** Application author */
  author: z
    .object({
      name: z.string(),
      email: z.string().email().optional(),
      url: z.string().url().optional(),
    })
    .optional(),

  /** License identifier (SPDX) */
  license: z.string().default('MIT'),

  /**
   * Required OpenClaw tool groups and individual tools.
   * These are validated at build time and documented in the app manifest.
   */
  requires: z
    .object({
      tools: z.array(z.string()).optional(),
      plugins: z.array(z.string()).optional(),
      env: z.array(z.string()).optional(),
      bins: z.array(z.string()).optional(),
    })
    .optional(),

  /** Tool access policy for this application */
  tools: ToolPolicySchema.optional(),

  /** Sandbox configuration */
  sandbox: SandboxConfigSchema.optional(),

  /** Default channel bindings */
  bindings: z.array(ChannelBindingSchema).optional(),

  /**
   * ClawKit-specific metadata for the app registry and UI.
   */
  clawkit: z
    .object({
      /** Category tags for discovery */
      tags: z.array(z.string()).optional(),
      /** URL to the app's homepage or documentation */
      homepage: z.string().url().optional(),
      /** Path to app icon (relative to project root) */
      icon: z.string().optional(),
      /** Minimum OpenClaw version required */
      minOpenClawVersion: z.string().optional(),
    })
    .optional(),
});

export type AppManifest = z.infer<typeof AppManifestSchema>;

// ─────────────────────────────────────────────
// Skill Types
// ─────────────────────────────────────────────

export const SkillMetaSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  homepage: z.string().url().optional(),
  'user-invocable': z.boolean().default(true),
  'disable-model-invocation': z.boolean().default(false),
  metadata: z
    .object({
      openclaw: z
        .object({
          emoji: z.string().optional(),
          homepage: z.string().url().optional(),
          requires: z
            .object({
              bins: z.array(z.string()).optional(),
              anyBins: z.array(z.string()).optional(),
              env: z.array(z.string()).optional(),
              config: z.array(z.string()).optional(),
            })
            .optional(),
          primaryEnv: z.string().optional(),
          always: z.boolean().optional(),
          os: z.array(z.enum(['darwin', 'linux', 'win32'])).optional(),
        })
        .optional(),
    })
    .optional(),
});

export type SkillMeta = z.infer<typeof SkillMetaSchema>;

// ─────────────────────────────────────────────
// Tool Types
// ─────────────────────────────────────────────

/** Context injected into every tool execution */
export interface ToolContext {
  /** The agent ID this tool is running under */
  agentId: string;
  /** The session key for the current conversation */
  sessionKey: string;
  /** The workspace directory path */
  workspaceDir: string;
  /** Memory ORM instance for reading/writing agent memory */
  memory: MemoryContext;
  /** Logger for tool output */
  log: ToolLogger;
}

export interface ToolLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

export interface MemoryContext {
  /** Read the long-term memory file (MEMORY.md) */
  readLongTerm(): Promise<string>;
  /** Append a note to today's daily memory log */
  appendDaily(note: string): Promise<void>;
  /** Write or update the long-term memory */
  writeLongTerm(content: string): Promise<void>;
  /** Search memory using semantic similarity */
  search(query: string): Promise<MemorySearchResult[]>;
}

export interface MemorySearchResult {
  content: string;
  source: string;
  score: number;
}

/** A field definition for tool input schema */
export interface FieldDefinition<T = unknown> {
  type: string;
  description: string;
  required: boolean;
  default?: T;
  enum?: T[];
}

/** The complete definition of a ClawKit tool */
export interface ToolDefinition<TInput extends Record<string, unknown> = Record<string, unknown>> {
  /** Tool name (snake_case, used as the OpenClaw tool identifier) */
  name: string;
  /** Human-readable description shown to the model */
  description: string;
  /** Input parameter schema */
  schema: Record<keyof TInput, FieldDefinition>;
  /** The tool execution function */
  execute(input: TInput, context: ToolContext): Promise<string | ToolResult>;
}

export interface ToolResult {
  /** Primary text output returned to the model */
  text: string;
  /** Whether the tool execution was successful */
  success: boolean;
  /** Optional structured data (not shown to model directly) */
  data?: unknown;
}

// ─────────────────────────────────────────────
// Build Output Types
// ─────────────────────────────────────────────

export interface BuildOutput {
  /** Path to the built workspace directory */
  workspaceDir: string;
  /** Path to the compiled plugin module (if tools were defined) */
  pluginPath?: string;
  /** Path to the generated openclaw.json fragment */
  configPath: string;
  /** List of built skills */
  skills: string[];
  /** Build warnings */
  warnings: string[];
}

export interface BuildOptions {
  /** Source project root */
  projectRoot: string;
  /** Output directory */
  outDir: string;
  /** Whether to minify output */
  minify?: boolean;
  /** Whether to emit source maps */
  sourcemap?: boolean;
}
