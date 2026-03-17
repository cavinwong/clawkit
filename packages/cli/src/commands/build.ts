/**
 * clawkit build — Build a ClawKit project into OpenClaw-compatible output
 *
 * Build process:
 * 1. Load and validate clawapp.yaml manifest
 * 2. Copy persona/ files → workspace bootstrap files (SOUL.md, AGENTS.md, etc.)
 * 3. Validate and copy skills/ directory
 * 4. Compile tools/ TypeScript → OpenClaw Plugin module
 * 5. Generate openclaw-config.json fragment
 * 6. Write build manifest to dist/
 */

import { join, resolve } from 'node:path';
import { readFile, writeFile, copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import { loadManifest, findManifest, manifestToOpenClawConfig, loadSkillsFromDir } from '@openclaw-kit/core';
import { logger } from '../utils/logger.js';
import { pathExists, writeFileSafe, writeJson, findProjectRoot } from '../utils/fs.js';

export interface BuildOptions {
  outDir?: string;
  sourcemap?: boolean;
  watch?: boolean;
}

export async function buildCommand(options: BuildOptions = {}): Promise<void> {
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    logger.error('No ClawKit project found. Run `clawkit init` first.');
    process.exit(1);
  }

  const outDir = resolve(projectRoot, options.outDir ?? 'dist');

  logger.blank();
  console.log(chalk.bold.cyan('  🦞 ClawKit Build'));
  console.log(chalk.dim('  ─────────────────'));
  logger.blank();

  const totalSteps = 6;
  let step = 0;

  // ── Step 1: Load manifest ──────────────────
  step++;
  const manifestSpinner = ora(`[${step}/${totalSteps}] Loading manifest...`).start();
  let manifest;
  try {
    const manifestPath = await findManifest(projectRoot);
    manifest = await loadManifest(manifestPath);
    manifestSpinner.succeed(
      chalk.green(`[${step}/${totalSteps}] Manifest loaded: ${manifest.name} v${manifest.version}`),
    );
  } catch (err) {
    manifestSpinner.fail(`[${step}/${totalSteps}] Manifest validation failed`);
    logger.error(String(err));
    process.exit(1);
  }

  // ── Step 2: Prepare output directory ──────
  step++;
  const dirSpinner = ora(`[${step}/${totalSteps}] Preparing output directory...`).start();
  const workspaceOut = join(outDir, 'workspace');
  const skillsOut = join(workspaceOut, 'skills');

  try {
    await mkdir(workspaceOut, { recursive: true });
    await mkdir(skillsOut, { recursive: true });
    dirSpinner.succeed(chalk.green(`[${step}/${totalSteps}] Output directory ready: ${outDir}`));
  } catch (err) {
    dirSpinner.fail(`[${step}/${totalSteps}] Failed to create output directory`);
    logger.error(String(err));
    process.exit(1);
  }

  // ── Step 3: Copy persona files ─────────────
  step++;
  const personaSpinner = ora(`[${step}/${totalSteps}] Processing persona files...`).start();
  const personaMap: Record<string, string> = {
    'soul.md': 'SOUL.md',
    'instructions.md': 'AGENTS.md',
    'user.md': 'USER.md',
    'identity.md': 'IDENTITY.md',
    'tools.md': 'TOOLS.md',
    'heartbeat.md': 'HEARTBEAT.md',
    'boot.md': 'BOOT.md',
    'memory.md': 'MEMORY.md',
  };

  const personaDir = join(projectRoot, 'persona');
  let copiedPersona = 0;

  try {
    if (await pathExists(personaDir)) {
      for (const [src, dest] of Object.entries(personaMap)) {
        const srcPath = join(personaDir, src);
        if (await pathExists(srcPath)) {
          await copyFile(srcPath, join(workspaceOut, dest));
          copiedPersona++;
        }
      }
    }
    personaSpinner.succeed(
      chalk.green(`[${step}/${totalSteps}] Persona files processed (${copiedPersona} files)`),
    );
  } catch (err) {
    personaSpinner.fail(`[${step}/${totalSteps}] Failed to process persona files`);
    logger.error(String(err));
    process.exit(1);
  }

  // ── Step 4: Validate and copy skills ──────
  step++;
  const skillsSpinner = ora(`[${step}/${totalSteps}] Processing skills...`).start();
  const skillsDir = join(projectRoot, 'skills');
  const warnings: string[] = [];

  try {
    const skills = await loadSkillsFromDir(skillsDir);

    for (const skill of skills) {
      const destDir = join(skillsOut, skill.id);
      await mkdir(destDir, { recursive: true });
      await writeFile(join(destDir, 'SKILL.md'), skill.raw, 'utf-8');

      // Copy any supporting files in the skill directory
      const skillSrcDir = join(skillsDir, skill.id);
      const entries = await readdir(skillSrcDir);
      for (const entry of entries) {
        if (entry === 'SKILL.md') continue;
        const entryStat = await stat(join(skillSrcDir, entry));
        if (entryStat.isFile()) {
          await copyFile(join(skillSrcDir, entry), join(destDir, entry));
        }
      }
    }

    skillsSpinner.succeed(
      chalk.green(`[${step}/${totalSteps}] Skills processed (${skills.length} skills)`),
    );
  } catch (err) {
    skillsSpinner.fail(`[${step}/${totalSteps}] Failed to process skills`);
    logger.error(String(err));
    process.exit(1);
  }

  // ── Step 5: Compile tools (if present) ────
  step++;
  const toolsSpinner = ora(`[${step}/${totalSteps}] Compiling tools...`).start();
  const toolsDir = join(projectRoot, 'tools');
  let pluginPath: string | undefined;

  if (await pathExists(toolsDir)) {
    try {
      // Use esbuild for fast TypeScript compilation
      const { build: esbuild } = await import('esbuild').catch(() => {
        throw new Error(
          'esbuild is required to compile tools. Run: pnpm add -D esbuild',
        );
      });

      const pluginOut = join(outDir, 'plugin');
      await mkdir(pluginOut, { recursive: true });

      await esbuild({
        entryPoints: [join(toolsDir, 'index.ts')],
        outfile: join(pluginOut, 'index.js'),
        bundle: true,
        platform: 'node',
        format: 'esm',
        target: 'node22',
        sourcemap: options.sourcemap ?? false,
        external: ['@openclaw-kit/core'],
      });

      // Write plugin manifest
      await writeJson(join(pluginOut, 'openclaw.plugin.json'), {
        name: `${manifest.name}-tools`,
        version: manifest.version,
        description: `Custom tools for ${manifest.displayName}`,
        main: './index.js',
        kind: 'tools',
      });

      pluginPath = pluginOut;
      toolsSpinner.succeed(chalk.green(`[${step}/${totalSteps}] Tools compiled → ${pluginOut}`));
    } catch (err) {
      // Tools compilation is optional — warn but don't fail
      toolsSpinner.warn(
        chalk.yellow(`[${step}/${totalSteps}] Tools compilation skipped: ${String(err)}`),
      );
      warnings.push(`Tools compilation skipped: ${String(err)}`);
    }
  } else {
    toolsSpinner.succeed(chalk.green(`[${step}/${totalSteps}] No tools directory found, skipping`));
  }

  // ── Step 6: Generate OpenClaw config fragment ──
  step++;
  const configSpinner = ora(`[${step}/${totalSteps}] Generating OpenClaw config...`).start();

  try {
    const config = manifestToOpenClawConfig(manifest);

    // Add plugin reference if tools were compiled
    if (pluginPath) {
      (config as Record<string, unknown>)['plugins'] = {
        entries: {
          [`${manifest.name}-tools`]: {
            enabled: true,
            path: './plugin',
          },
        },
      };
    }

    const configPath = join(outDir, 'openclaw-config.json');
    await writeJson(configPath, config);

    // Write build summary
    const buildSummary = {
      name: manifest.name,
      version: manifest.version,
      builtAt: new Date().toISOString(),
      workspaceDir: workspaceOut,
      pluginPath,
      configPath,
      warnings,
    };
    await writeJson(join(outDir, 'build.json'), buildSummary);

    configSpinner.succeed(
      chalk.green(`[${step}/${totalSteps}] OpenClaw config generated → ${configPath}`),
    );
  } catch (err) {
    configSpinner.fail(`[${step}/${totalSteps}] Failed to generate config`);
    logger.error(String(err));
    process.exit(1);
  }

  // ── Summary ───────────────────────────────
  logger.blank();
  logger.section('Build Summary');
  logger.blank();
  logger.kv('Application', `${manifest.displayName} v${manifest.version}`);
  logger.kv('Output', outDir);
  logger.kv('Workspace', workspaceOut);
  if (pluginPath) logger.kv('Plugin', pluginPath);

  if (warnings.length > 0) {
    logger.blank();
    console.log(chalk.yellow('  Warnings:'));
    for (const w of warnings) {
      console.log(chalk.yellow(`    ⚠ ${w}`));
    }
  }

  logger.blank();
  console.log(chalk.bold.green('  ✓ Build complete!'));
  logger.blank();
  console.log(chalk.dim('  To deploy, run: ') + chalk.cyan('clawkit pack'));
  logger.blank();
}
