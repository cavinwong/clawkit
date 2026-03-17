/**
 * ClawKit CLI filesystem utilities
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { constants } from 'node:fs';

/**
 * Check if a path exists.
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Write a file, creating parent directories as needed.
 */
export async function writeFileSafe(filePath: string, content: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf-8');
}

/**
 * Read a JSON file and parse it.
 */
export async function readJson<T = unknown>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Write a JSON file with pretty formatting.
 */
export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await writeFileSafe(filePath, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Find the project root by walking up from cwd looking for clawapp.yaml/json.
 */
export async function findProjectRoot(startDir = process.cwd()): Promise<string | null> {
  let current = resolve(startDir);
  const root = resolve('/');

  while (current !== root) {
    for (const name of ['clawapp.yaml', 'clawapp.yml', 'clawapp.json']) {
      if (await pathExists(join(current, name))) {
        return current;
      }
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return null;
}

/**
 * Ensure a directory exists, creating it if necessary.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}
