/**
 * clawkit dev — Start a development environment with hot reload
 *
 * This command:
 * 1. Runs an initial build
 * 2. Watches for file changes and rebuilds automatically
 * 3. Provides a local test interface via the OpenClaw CLI
 */

import { join, resolve } from 'node:path';
import { watch } from 'node:fs';
import chalk from 'chalk';
import ora from 'ora';
import { findManifest, loadManifest } from '@openclaw-kit/core';
import { logger } from '../utils/logger.js';
import { findProjectRoot } from '../utils/fs.js';
import { buildCommand } from './build.js';

export interface DevOptions {
  port?: number;
  outDir?: string;
}

export async function devCommand(options: DevOptions = {}): Promise<void> {
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    logger.error('No ClawKit project found. Run `clawkit init` first.');
    process.exit(1);
  }

  logger.blank();
  console.log(chalk.bold.cyan('  🦞 ClawKit Dev Mode'));
  console.log(chalk.dim('  ────────────────────'));
  logger.blank();

  // Load manifest for display
  const manifestPath = await findManifest(projectRoot);
  const manifest = await loadManifest(manifestPath);

  logger.kv('Project', `${manifest.displayName} v${manifest.version}`);
  logger.kv('Root', projectRoot);
  logger.blank();

  // Initial build
  logger.info('Running initial build...');
  await buildCommand({ outDir: options.outDir ?? '.clawkit/dev', sourcemap: true });

  logger.blank();
  logger.info('Watching for changes...');
  logger.blank();

  // Set up file watchers
  const watchDirs = [
    join(projectRoot, 'persona'),
    join(projectRoot, 'skills'),
    join(projectRoot, 'tools'),
    join(projectRoot, 'workflows'),
    join(projectRoot, 'clawapp.yaml'),
    join(projectRoot, 'clawapp.yml'),
    join(projectRoot, 'clawapp.json'),
  ];

  let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
  let isRebuilding = false;

  const scheduleRebuild = (changedPath: string) => {
    if (rebuildTimer) clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(async () => {
      if (isRebuilding) return;
      isRebuilding = true;

      const relPath = changedPath.replace(projectRoot, '').replace(/^\//, '');
      console.log(chalk.dim(`  ↺ Change detected: ${relPath}`));

      try {
        await buildCommand({ outDir: options.outDir ?? '.clawkit/dev', sourcemap: true });
        console.log(chalk.green('  ✓ Rebuild complete'));
      } catch {
        console.log(chalk.red('  ✗ Rebuild failed'));
      } finally {
        isRebuilding = false;
      }
    }, 300); // Debounce 300ms
  };

  for (const watchPath of watchDirs) {
    try {
      watch(watchPath, { recursive: true }, (_event, filename) => {
        if (filename) {
          scheduleRebuild(join(watchPath, filename));
        }
      });
    } catch {
      // Path doesn't exist, skip
    }
  }

  // Print instructions
  console.log(chalk.dim('  ┌─────────────────────────────────────────────┐'));
  console.log(chalk.dim('  │') + chalk.white('  Dev server running. Press Ctrl+C to stop.  ') + chalk.dim('│'));
  console.log(chalk.dim('  └─────────────────────────────────────────────┘'));
  logger.blank();

  // Check if OpenClaw is available
  const { execa } = await import('execa');
  try {
    await execa('openclaw', ['--version'], { reject: false });
    logger.info('OpenClaw detected. To test your agent, run in another terminal:');
    logger.blank();
    logger.code(`openclaw agent --message "Hello" --workspace ${resolve(projectRoot, '.clawkit/dev/workspace')}`);
  } catch {
    logger.warn('OpenClaw not found. Install it to test your agent:');
    logger.code('npm install -g openclaw@latest');
  }

  logger.blank();

  // Keep process alive
  process.on('SIGINT', () => {
    logger.blank();
    logger.info('Dev mode stopped.');
    process.exit(0);
  });

  // Prevent process from exiting
  await new Promise(() => {});
}
