/**
 * @clawkit/core
 *
 * The core SDK for building OpenClaw agent applications.
 * Provides type-safe abstractions for the full ClawKit development lifecycle.
 *
 * @example
 * ```ts
 * import { Tool, Field, MemoryStore, loadManifest } from '@clawkit/core';
 *
 * export const myTool = Tool.define({
 *   name: 'my_tool',
 *   description: 'Does something useful',
 *   schema: {
 *     input: Field.string('The input to process'),
 *   },
 *   async execute({ input }, ctx) {
 *     await ctx.memory.appendDaily(`Processed: ${input}`);
 *     return `Done: ${input}`;
 *   },
 * });
 * ```
 *
 * @packageDocumentation
 */

// Types
export type {
  AppManifest,
  ChannelBinding,
  ToolPolicy,
  SandboxConfig,
  SkillMeta,
  ToolDefinition,
  ToolContext,
  ToolResult,
  FieldDefinition,
  MemoryContext,
  MemorySearchResult,
  BuildOutput,
  BuildOptions,
} from './types/index.js';

// Manifest
export {
  parseManifest,
  loadManifest,
  findManifest,
  manifestToOpenClawConfig,
  ManifestValidationError,
} from './manifest/index.js';

// Tool SDK
export { Tool, Field, ToolRegistry, z } from './tool/index.js';

// Memory ORM
export {
  MemoryStore,
  parseSections,
  serializeSections,
  type MemoryStoreOptions,
  type MemorySection,
} from './memory/index.js';

// Skill utilities
export {
  parseSkill,
  loadSkillsFromDir,
  generateSkillTemplate,
  SkillValidationError,
  type ParsedSkill,
  type SkillTemplateOptions,
} from './skill/index.js';

/** ClawKit core version */
export const VERSION = '0.1.0';
