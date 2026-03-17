#!/usr/bin/env node
/**
 * create-clawkit-app
 *
 * Interactive scaffolding tool for creating new ClawKit agent applications.
 * Designed to be used with `npm create clawkit-app` or `pnpm create clawkit-app`.
 *
 * Usage:
 *   npm create clawkit-app
 *   npm create clawkit-app my-agent
 *   npm create clawkit-app my-agent --template workflow
 */

import chalk from 'chalk';
import { initCommand } from '@openclaw-kit/cli';

// ─────────────────────────────────────────────
// Banner
// ─────────────────────────────────────────────

console.log('');
console.log(chalk.bold.cyan('  ╔═══════════════════════════════════════╗'));
console.log(chalk.bold.cyan('  ║') + chalk.bold.white('   🦞  Create ClawKit App              ') + chalk.bold.cyan('║'));
console.log(chalk.bold.cyan('  ║') + chalk.dim('   The OpenClaw Application Framework  ') + chalk.bold.cyan('║'));
console.log(chalk.bold.cyan('  ╚═══════════════════════════════════════╝'));
console.log('');

// ─────────────────────────────────────────────
// Parse args
// ─────────────────────────────────────────────

const args = process.argv.slice(2);
const projectName = args.find((a) => !a.startsWith('-'));
const templateArg = args.find((a) => a.startsWith('--template='))?.split('=')[1]
  ?? (args.indexOf('--template') >= 0 ? args[args.indexOf('--template') + 1] : undefined);
const isYes = args.includes('--yes') || args.includes('-y');

// ─────────────────────────────────────────────
// Interactive prompts (if no args provided)
// ─────────────────────────────────────────────

async function main() {
  let name = projectName;
  let template: 'basic' | 'team-bot' | 'workflow' = 'basic';

  if (!name || !isYes) {
    const { prompt } = await import('enquirer');

    if (!name) {
      const response = await prompt<{ name: string }>({
        type: 'input',
        name: 'name',
        message: 'What is your project name?',
        initial: 'my-agent',
        validate: (value: string) => {
          if (!/^[a-z0-9-]+$/.test(value)) {
            return 'Name must be lowercase alphanumeric with hyphens (e.g. my-agent)';
          }
          return true;
        },
      });
      name = response.name;
    }

    if (!templateArg) {
      const response = await prompt<{ template: string }>({
        type: 'select',
        name: 'template',
        message: 'Select a template:',
        choices: [
          {
            name: 'basic',
            message: `${chalk.bold('Basic')} — General-purpose personal assistant`,
            hint: 'Recommended for most use cases',
          },
          {
            name: 'team-bot',
            message: `${chalk.bold('Team Bot')} — Multi-channel assistant for teams`,
            hint: 'Slack, Discord, Telegram integration',
          },
          {
            name: 'workflow',
            message: `${chalk.bold('Workflow Agent')} — Automation-focused with Lobster pipelines`,
            hint: 'For complex, multi-step automations',
          },
        ],
      });
      template = response.template as typeof template;
    } else {
      template = (templateArg as typeof template) ?? 'basic';
    }
  } else {
    template = (templateArg as typeof template) ?? 'basic';
  }

  // Delegate to the CLI init command
  await initCommand(name ?? 'my-agent', { template, yes: isYes });
}

main().catch((err: unknown) => {
  console.error(chalk.red('\n  Error:'), err);
  process.exit(1);
});
