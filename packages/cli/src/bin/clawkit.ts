#!/usr/bin/env node
/**
 * ClawKit CLI — The application development framework for OpenClaw
 *
 * Usage:
 *   clawkit init <name>          Create a new ClawKit project
 *   clawkit add skill <name>     Add a new skill
 *   clawkit add tool <name>      Add a new tool
 *   clawkit add workflow <name>  Add a new workflow
 *   clawkit build                Build the project
 *   clawkit dev                  Start development mode
 *   clawkit pack                 Package for distribution
 *   clawkit info                 Show project information
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from '../commands/init.js';
import { addCommand, type AddTarget } from '../commands/add.js';
import { buildCommand } from '../commands/build.js';
import { devCommand } from '../commands/dev.js';
import { packCommand } from '../commands/pack.js';
import { infoCommand } from '../commands/info.js';

const program = new Command();

program
  .name('clawkit')
  .description(
    chalk.cyan('🦞 ClawKit') +
      ' — The application development framework for ' +
      chalk.underline('OpenClaw'),
  )
  .version('0.1.0', '-v, --version', 'Output the current version')
  .helpOption('-h, --help', 'Display help for command');

// ── init ──────────────────────────────────────

program
  .command('init [name]')
  .description('Create a new ClawKit agent application')
  .option('-t, --template <template>', 'Project template (basic|team-bot|workflow)', 'basic')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (name: string | undefined, options: { template: string; yes: boolean }) => {
    await initCommand(name ?? 'my-agent', {
      template: options.template as 'basic' | 'team-bot' | 'workflow',
      yes: options.yes,
    });
  });

// ── add ───────────────────────────────────────

const addCmd = program
  .command('add')
  .description('Add a skill, tool, or workflow to the current project');

addCmd
  .command('skill <name>')
  .description('Add a new skill (SKILL.md) to the project')
  .option('-d, --description <text>', 'Skill description')
  .option('-e, --emoji <emoji>', 'Skill emoji icon')
  .action(async (name: string, options: { description?: string; emoji?: string }) => {
    await addCommand('skill' as AddTarget, name, options);
  });

addCmd
  .command('tool <name>')
  .description('Add a new TypeScript tool to the project')
  .option('-d, --description <text>', 'Tool description')
  .action(async (name: string, options: { description?: string }) => {
    await addCommand('tool' as AddTarget, name, options);
  });

addCmd
  .command('workflow <name>')
  .description('Add a new Lobster workflow to the project')
  .option('-d, --description <text>', 'Workflow description')
  .action(async (name: string, options: { description?: string }) => {
    await addCommand('workflow' as AddTarget, name, options);
  });

// ── build ─────────────────────────────────────

program
  .command('build')
  .description('Build the project into OpenClaw-compatible output')
  .option('-o, --out-dir <dir>', 'Output directory', 'dist')
  .option('--sourcemap', 'Generate source maps')
  .action(async (options: { outDir: string; sourcemap: boolean }) => {
    await buildCommand({
      outDir: options.outDir,
      sourcemap: options.sourcemap,
    });
  });

// ── dev ───────────────────────────────────────

program
  .command('dev')
  .description('Start development mode with hot reload')
  .option('-p, --port <port>', 'Gateway port', '18789')
  .action(async (options: { port: string }) => {
    await devCommand({ port: parseInt(options.port, 10) });
  });

// ── pack ──────────────────────────────────────

program
  .command('pack')
  .description('Package the built project into a distributable .clawapp archive')
  .option('-o, --output <filename>', 'Output archive filename')
  .option('--skip-build', 'Skip the build step')
  .action(async (options: { output?: string; skipBuild: boolean }) => {
    await packCommand({
      ...(options.output !== undefined && { output: options.output }),
      skipBuild: options.skipBuild,
    });
  });

// ── info ──────────────────────────────────────

program
  .command('info')
  .description('Display information about the current ClawKit project')
  .action(async () => {
    await infoCommand();
  });

// ── Error handling ────────────────────────────

program.on('command:*', (operands: string[]) => {
  console.error(chalk.red(`\n  Unknown command: ${operands[0] ?? ''}`));
  console.log(chalk.dim('  Run `clawkit --help` for available commands.\n'));
  process.exit(1);
});

// Parse and execute
program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(chalk.red('\n  Fatal error:'), err);
  process.exit(1);
});
