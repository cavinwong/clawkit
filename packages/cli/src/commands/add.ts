/**
 * clawkit add — Add a skill, tool, or workflow to an existing project
 */

import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import { generateSkillTemplate } from '@clawkit/core';
import { logger } from '../utils/logger.js';
import { pathExists, writeFileSafe, findProjectRoot } from '../utils/fs.js';

export type AddTarget = 'skill' | 'tool' | 'workflow';

export interface AddOptions {
  description?: string;
  emoji?: string;
}

export async function addCommand(
  target: AddTarget,
  name: string,
  options: AddOptions,
): Promise<void> {
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    logger.error('No ClawKit project found. Run `clawkit init` first.');
    process.exit(1);
  }

  logger.blank();

  switch (target) {
    case 'skill':
      await addSkill(projectRoot, name, options);
      break;
    case 'tool':
      await addTool(projectRoot, name, options);
      break;
    case 'workflow':
      await addWorkflow(projectRoot, name, options);
      break;
    default:
      logger.error(`Unknown target: ${String(target)}. Use: skill, tool, or workflow`);
      process.exit(1);
  }
}

// ─────────────────────────────────────────────
// Add Skill
// ─────────────────────────────────────────────

async function addSkill(projectRoot: string, name: string, options: AddOptions): Promise<void> {
  const skillDir = join(projectRoot, 'skills', name);
  const skillFile = join(skillDir, 'SKILL.md');

  if (await pathExists(skillDir)) {
    logger.error(`Skill "${name}" already exists at ${skillDir}`);
    process.exit(1);
  }

  const spinner = ora(`Creating skill "${name}"...`).start();

  try {
    await mkdir(skillDir, { recursive: true });
    const content = generateSkillTemplate({
      name: toTitleCase(name),
      description: options.description ?? `A skill that teaches the agent how to ${name}`,
      emoji: options.emoji ?? '🔧',
    });
    await writeFileSafe(skillFile, content);
    spinner.succeed(chalk.green(`Skill "${name}" created`));
  } catch (err) {
    spinner.fail('Failed to create skill');
    logger.error(String(err));
    process.exit(1);
  }

  logger.blank();
  logger.kv('Location', skillFile);
  logger.blank();
  console.log(chalk.dim('  Edit the SKILL.md to define how the agent should use this skill.'));
  logger.blank();
}

// ─────────────────────────────────────────────
// Add Tool
// ─────────────────────────────────────────────

async function addTool(projectRoot: string, name: string, options: AddOptions): Promise<void> {
  const toolsDir = join(projectRoot, 'tools');
  const toolFile = join(toolsDir, `${toKebabCase(name)}.ts`);
  const indexFile = join(toolsDir, 'index.ts');

  if (await pathExists(toolFile)) {
    logger.error(`Tool file "${toolFile}" already exists`);
    process.exit(1);
  }

  const spinner = ora(`Creating tool "${name}"...`).start();

  try {
    await mkdir(toolsDir, { recursive: true });

    const toolContent = generateToolTemplate(name, options.description);
    await writeFileSafe(toolFile, toolContent);

    // Update index.ts to include the new tool
    if (await pathExists(indexFile)) {
      await appendToolToIndex(indexFile, name);
    }

    spinner.succeed(chalk.green(`Tool "${name}" created`));
  } catch (err) {
    spinner.fail('Failed to create tool');
    logger.error(String(err));
    process.exit(1);
  }

  logger.blank();
  logger.kv('Location', toolFile);
  logger.blank();
  console.log(chalk.dim('  Implement the tool logic in the execute() function.'));
  console.log(chalk.dim('  Run `clawkit build` to compile the tool into an OpenClaw plugin.'));
  logger.blank();
}

// ─────────────────────────────────────────────
// Add Workflow
// ─────────────────────────────────────────────

async function addWorkflow(
  projectRoot: string,
  name: string,
  options: AddOptions,
): Promise<void> {
  const workflowsDir = join(projectRoot, 'workflows');
  const workflowFile = join(workflowsDir, `${toKebabCase(name)}.lobster`);

  if (await pathExists(workflowFile)) {
    logger.error(`Workflow "${name}" already exists at ${workflowFile}`);
    process.exit(1);
  }

  const spinner = ora(`Creating workflow "${name}"...`).start();

  try {
    await mkdir(workflowsDir, { recursive: true });
    const content = generateWorkflowTemplate(name, options.description);
    await writeFileSafe(workflowFile, content);
    spinner.succeed(chalk.green(`Workflow "${name}" created`));
  } catch (err) {
    spinner.fail('Failed to create workflow');
    logger.error(String(err));
    process.exit(1);
  }

  logger.blank();
  logger.kv('Location', workflowFile);
  logger.blank();
  console.log(
    chalk.dim('  Edit the .lobster file to define your workflow steps.'),
  );
  console.log(
    chalk.dim('  See: https://docs.openclaw.ai/tools/lobster'),
  );
  logger.blank();
}

// ─────────────────────────────────────────────
// Template generators
// ─────────────────────────────────────────────

function generateToolTemplate(name: string, description?: string): string {
  const toolName = toSnakeCase(name);
  const varName = toCamelCase(name);
  const desc = description ?? `Performs the ${name} operation`;

  return `/**
 * ${toTitleCase(name)} tool
 * ${desc}
 */

import { Tool, Field } from '@clawkit/core';

export const ${varName} = Tool.define({
  name: '${toolName}',
  description: '${desc}',
  schema: {
    // Define your input parameters here
    input: Field.string('The primary input for this tool'),
  },
  async execute({ input }, ctx) {
    // TODO: Implement tool logic here
    ctx.log.info(\`${toTitleCase(name)} called with: \${input}\`);

    // Example: log to daily memory
    await ctx.memory.appendDaily(\`${toolName} executed with input: \${input}\`);

    return \`${toTitleCase(name)} completed: \${input}\`;
  },
});
`;
}

async function appendToolToIndex(indexFile: string, name: string): Promise<void> {
  const { readFile, writeFile } = await import('node:fs/promises');
  const content = await readFile(indexFile, 'utf-8');
  const varName = toCamelCase(name);
  const fileName = toKebabCase(name);

  // Add import
  const importLine = `import { ${varName} } from './${fileName}.js';`;
  const updatedContent = content
    .replace(
      /^(import .+\n)+/m,
      (match) => match + importLine + '\n',
    )
    .replace(
      /export const tools: ToolDefinition\[\] = \[([^\]]*)\]/,
      (match, inner: string) => {
        const trimmed = inner.trim();
        const newInner = trimmed ? `${trimmed}, ${varName}` : varName;
        return `export const tools: ToolDefinition[] = [${newInner}]`;
      },
    );

  await writeFile(indexFile, updatedContent, 'utf-8');
}

function generateWorkflowTemplate(name: string, description?: string): string {
  const desc = description ?? `A workflow for ${name}`;
  return `# ${toTitleCase(name)} Workflow
# Documentation: https://docs.openclaw.ai/tools/lobster

name: ${toKebabCase(name)}
description: ${desc}

steps:
  - id: start
    description: Initial step — gather required information
    tools:
      - read

  - id: process
    description: Main processing step
    tools:
      - exec
    approval: false

  - id: review
    description: Review results before finalizing
    approval: true

  - id: complete
    description: Finalize and notify
    tools:
      - write
`;
}

// ─────────────────────────────────────────────
// String utilities
// ─────────────────────────────────────────────

function toTitleCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

function toCamelCase(str: string): string {
  const kebab = toKebabCase(str);
  return kebab.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}
