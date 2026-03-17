/**
 * @clawkit/core - Manifest parser and validator
 *
 * Parses and validates clawapp.yaml / clawapp.json manifest files,
 * converting them into strongly-typed AppManifest objects.
 */

import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { z } from 'zod';
import { AppManifestSchema, type AppManifest } from '../types/index.js';

export class ManifestValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.ZodIssue[],
  ) {
    super(message);
    this.name = 'ManifestValidationError';
  }
}

/**
 * Parse a raw manifest object (already loaded from YAML/JSON) into
 * a validated AppManifest. Throws ManifestValidationError on failure.
 */
export function parseManifest(raw: unknown): AppManifest {
  const result = AppManifestSchema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new ManifestValidationError(
      `Invalid clawapp manifest:\n${messages}`,
      result.error.issues,
    );
  }
  return result.data;
}

/**
 * Load and parse a manifest file from disk.
 * Supports both .yaml/.yml and .json formats.
 */
export async function loadManifest(manifestPath: string): Promise<AppManifest> {
  const absolutePath = resolve(manifestPath);
  const content = await readFile(absolutePath, 'utf-8');
  const ext = extname(absolutePath).toLowerCase();

  let raw: unknown;

  if (ext === '.json') {
    raw = JSON.parse(content) as unknown;
  } else if (ext === '.yaml' || ext === '.yml') {
    // Use gray-matter's bundled yaml parser (already a dependency)
    const { load } = await import('js-yaml');
    raw = load(content);
  } else {
    throw new Error(
      `Unsupported manifest format: ${ext}. Use .yaml, .yml, or .json`,
    );
  }

  return parseManifest(raw);
}

/**
 * Find the manifest file in a project directory.
 * Searches for clawapp.yaml, clawapp.yml, and clawapp.json in order.
 */
export async function findManifest(projectRoot: string): Promise<string> {
  const candidates = ['clawapp.yaml', 'clawapp.yml', 'clawapp.json'];

  for (const candidate of candidates) {
    const fullPath = resolve(projectRoot, candidate);
    try {
      await readFile(fullPath);
      return fullPath;
    } catch {
      // File not found, try next
    }
  }

  throw new Error(
    `No manifest file found in ${projectRoot}.\n` +
      `Expected one of: ${candidates.join(', ')}\n` +
      `Run \`clawkit init\` to create a new project.`,
  );
}

/**
 * Generate an OpenClaw-compatible agent configuration fragment
 * from a ClawKit AppManifest.
 */
export function manifestToOpenClawConfig(manifest: AppManifest): Record<string, unknown> {
  const config: Record<string, unknown> = {
    agents: {
      list: [
        {
          id: manifest.name,
          label: manifest.displayName,
          workspace: `~/.openclaw/apps/${manifest.name}/workspace`,
          ...(manifest.tools && {
            tools: {
              profile: manifest.tools.profile,
              ...(manifest.tools.allow && { allow: manifest.tools.allow }),
              ...(manifest.tools.deny && { deny: manifest.tools.deny }),
            },
          }),
          ...(manifest.sandbox && {
            sandbox: {
              mode: manifest.sandbox.mode,
              backend: manifest.sandbox.backend,
              scope: manifest.sandbox.scope,
            },
          }),
        },
      ],
    },
  };

  if (manifest.bindings && manifest.bindings.length > 0) {
    (config['agents'] as Record<string, unknown>)['bindings'] = manifest.bindings.map((b) => ({
      channel: b.channel,
      ...(b.accountId && { accountId: b.accountId }),
      ...(b.peer && { peer: b.peer }),
      agentId: manifest.name,
    }));
  }

  return config;
}

export type { AppManifest };
