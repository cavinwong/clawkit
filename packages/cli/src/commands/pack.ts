/**
 * clawkit pack — Package a built ClawKit project into a distributable .clawapp archive
 */

import { join, resolve } from 'node:path';
import { readdir, stat, createReadStream, createWriteStream } from 'node:fs';
import { promisify } from 'node:util';
import chalk from 'chalk';
import ora from 'ora';
import { findManifest, loadManifest } from '@openclaw-kit/core';
import { logger } from '../utils/logger.js';
import { pathExists, findProjectRoot } from '../utils/fs.js';
import { buildCommand } from './build.js';

const readdirAsync = promisify(readdir);
const statAsync = promisify(stat);

export interface PackOptions {
  outDir?: string;
  skipBuild?: boolean;
  output?: string;
}

export async function packCommand(options: PackOptions = {}): Promise<void> {
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    logger.error('No ClawKit project found. Run `clawkit init` first.');
    process.exit(1);
  }

  logger.blank();
  console.log(chalk.bold.cyan('  🦞 ClawKit Pack'));
  console.log(chalk.dim('  ─────────────────'));
  logger.blank();

  // Load manifest
  const manifestPath = await findManifest(projectRoot);
  const manifest = await loadManifest(manifestPath);

  const distDir = resolve(projectRoot, options.outDir ?? 'dist');

  // Run build first unless skipped
  if (!options.skipBuild) {
    logger.info('Building project before packing...');
    await buildCommand({ outDir: distDir });
  }

  // Check dist exists
  if (!(await pathExists(distDir))) {
    logger.error(`Build output not found at ${distDir}. Run \`clawkit build\` first.`);
    process.exit(1);
  }

  const archiveName = options.output ?? `${manifest.name}-${manifest.version}.clawapp`;
  const archivePath = join(projectRoot, archiveName);

  const spinner = ora(`Creating archive ${archiveName}...`).start();

  try {
    // Use archiver (zip format) to create the .clawapp package
    const archiver = await import('archiver').catch(() => {
      throw new Error('archiver is required. Run: pnpm add -D archiver @types/archiver');
    });

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(archivePath);
      const archive = archiver.default('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', reject);

      archive.pipe(output);

      // Add dist contents
      archive.directory(distDir, false);

      // Add manifest at root
      archive.file(manifestPath, { name: 'clawapp.yaml' });

      void archive.finalize();
    });

    const archiveStat = await statAsync(archivePath);
    const sizeKb = Math.round(archiveStat.size / 1024);

    spinner.succeed(chalk.green(`Archive created: ${archiveName} (${sizeKb} KB)`));
  } catch (err) {
    spinner.fail('Failed to create archive');
    logger.error(String(err));

    // Fallback: create a simple directory-based package info
    logger.warn('Falling back to directory-based package (archiver not available)');
    logger.info(`Build output is available at: ${distDir}`);
  }

  logger.blank();
  logger.section('Package Summary');
  logger.blank();
  logger.kv('Application', `${manifest.displayName} v${manifest.version}`);
  logger.kv('Archive', archivePath);
  logger.blank();
  console.log(chalk.dim('  To install on an OpenClaw instance:'));
  logger.code(`openclaw app install ./${archiveName}`);
  logger.blank();
}
