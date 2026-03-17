/**
 * @openclaw-kit/core - Skill utilities
 *
 * Utilities for parsing, validating, and generating SKILL.md files
 * that conform to the OpenClaw AgentSkills specification.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import matter from 'gray-matter';
import { SkillMetaSchema, type SkillMeta } from '../types/index.js';

// ─────────────────────────────────────────────
// Skill file parsing
// ─────────────────────────────────────────────

export interface ParsedSkill {
  /** Skill directory name (used as the skill identifier) */
  id: string;
  /** Full path to the SKILL.md file */
  path: string;
  /** Parsed YAML frontmatter metadata */
  meta: SkillMeta;
  /** Markdown body content (the instructions) */
  body: string;
  /** Raw file content */
  raw: string;
}

export class SkillValidationError extends Error {
  constructor(
    message: string,
    public readonly skillPath: string,
  ) {
    super(message);
    this.name = 'SkillValidationError';
  }
}

/**
 * Parse a single SKILL.md file.
 */
export async function parseSkill(skillPath: string): Promise<ParsedSkill> {
  const raw = await readFile(skillPath, 'utf-8');
  const { data, content } = matter(raw);

  const metaResult = SkillMetaSchema.safeParse(data);
  if (!metaResult.success) {
    const issues = metaResult.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new SkillValidationError(
      `Invalid SKILL.md frontmatter at ${skillPath}:\n${issues}`,
      skillPath,
    );
  }

  // The skill ID is the parent directory name
  const parts = skillPath.split('/');
  const skillDir = parts[parts.length - 2] ?? basename(skillPath, '.md');

  return {
    id: skillDir,
    path: skillPath,
    meta: metaResult.data,
    body: content.trim(),
    raw,
  };
}

/**
 * Scan a skills directory and parse all SKILL.md files found.
 */
export async function loadSkillsFromDir(skillsDir: string): Promise<ParsedSkill[]> {
  const skills: ParsedSkill[] = [];

  let entries: string[];
  try {
    entries = await readdir(skillsDir);
  } catch {
    return []; // Directory doesn't exist, return empty
  }

  for (const entry of entries) {
    const entryPath = join(skillsDir, entry);
    const entryStat = await stat(entryPath);

    if (entryStat.isDirectory()) {
      const skillFilePath = join(entryPath, 'SKILL.md');
      try {
        const skill = await parseSkill(skillFilePath);
        skills.push(skill);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw err;
        }
        // No SKILL.md in this directory, skip
      }
    }
  }

  return skills;
}

// ─────────────────────────────────────────────
// Skill template generation
// ─────────────────────────────────────────────

export interface SkillTemplateOptions {
  name: string;
  description: string;
  emoji?: string;
  userInvocable?: boolean;
  requiresBins?: string[];
  requiresEnv?: string[];
}

/**
 * Generate a SKILL.md template with proper frontmatter.
 */
export function generateSkillTemplate(options: SkillTemplateOptions): string {
  const {
    name,
    description,
    emoji = '🔧',
    userInvocable = true,
    requiresBins = [],
    requiresEnv = [],
  } = options;

  const frontmatter: Record<string, unknown> = {
    name,
    description,
    'user-invocable': userInvocable,
    metadata: {
      openclaw: {
        emoji,
        ...(requiresBins.length > 0 && { requires: { bins: requiresBins } }),
        ...(requiresEnv.length > 0 && {
          requires: {
            ...(requiresBins.length > 0 && { bins: requiresBins }),
            env: requiresEnv,
          },
        }),
      },
    },
  };

  const yamlLines = serializeYaml(frontmatter);

  return `---
${yamlLines}---

# ${name}

${description}

## When to use this skill

Describe the situations where this skill should be invoked.

## How it works

Explain the step-by-step process the agent should follow.

## Examples

Provide concrete examples of inputs and expected outputs.

\`\`\`
User: [example input]
Agent: [example response]
\`\`\`

## Notes

Any important caveats, limitations, or tips for the agent.
`;
}

/** Simple YAML serializer for frontmatter (avoids a full yaml dep in output) */
function serializeYaml(obj: Record<string, unknown>, indent = 0): string {
  const lines: string[] = [];
  const prefix = '  '.repeat(indent);

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      lines.push(`${prefix}${key}:`);
      lines.push(serializeYaml(value as Record<string, unknown>, indent + 1));
    } else if (Array.isArray(value)) {
      lines.push(`${prefix}${key}:`);
      for (const item of value) {
        lines.push(`${prefix}  - ${String(item)}`);
      }
    } else if (typeof value === 'string') {
      // Quote strings that need it
      const needsQuotes = value.includes(':') || value.includes('#') || value.startsWith(' ');
      lines.push(`${prefix}${key}: ${needsQuotes ? `"${value}"` : value}`);
    } else {
      lines.push(`${prefix}${key}: ${String(value)}`);
    }
  }

  return lines.join('\n');
}

export type { SkillMeta };
