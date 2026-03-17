/**
 * clawkit init — Initialize a new ClawKit agent application
 */

import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import { logger } from '../utils/logger.js';
import { pathExists, writeFileSafe } from '../utils/fs.js';

export interface InitOptions {
  name?: string;
  template?: 'basic' | 'team-bot' | 'workflow';
  yes?: boolean;
}

const TEMPLATES = {
  basic: 'Basic assistant — a general-purpose personal AI agent',
  'team-bot': 'Team bot — a multi-channel assistant for teams',
  workflow: 'Workflow agent — an automation-focused agent with Lobster workflows',
};

export async function initCommand(projectName: string, options: InitOptions): Promise<void> {
  const name = projectName || options.name || 'my-agent';
  const template = options.template || 'basic';
  const projectDir = join(process.cwd(), name);

  logger.blank();
  console.log(chalk.bold.cyan('  🦞 ClawKit — Create a new agent application'));
  console.log(chalk.dim('  ─────────────────────────────────────────'));
  logger.blank();

  // Check if directory already exists
  if (await pathExists(projectDir)) {
    logger.error(`Directory "${name}" already exists.`);
    process.exit(1);
  }

  logger.kv('Project name', name);
  logger.kv('Template', `${template} — ${TEMPLATES[template]}`);
  logger.kv('Directory', projectDir);
  logger.blank();

  const spinner = ora('Creating project structure...').start();

  try {
    // Create directory structure
    await mkdir(projectDir, { recursive: true });
    await mkdir(join(projectDir, 'persona'), { recursive: true });
    await mkdir(join(projectDir, 'skills'), { recursive: true });
    await mkdir(join(projectDir, 'tools'), { recursive: true });
    await mkdir(join(projectDir, 'workflows'), { recursive: true });
    await mkdir(join(projectDir, 'tests'), { recursive: true });

    spinner.text = 'Writing manifest file...';

    // Write clawapp.yaml
    await writeFileSafe(
      join(projectDir, 'clawapp.yaml'),
      generateManifest(name, template),
    );

    spinner.text = 'Writing persona files...';

    // Write persona files
    await writeFileSafe(
      join(projectDir, 'persona', 'soul.md'),
      generateSoul(name, template),
    );
    await writeFileSafe(
      join(projectDir, 'persona', 'instructions.md'),
      generateInstructions(name, template),
    );
    await writeFileSafe(
      join(projectDir, 'persona', 'user.md'),
      generateUserProfile(),
    );

    spinner.text = 'Writing starter skill...';

    // Write starter skill
    await mkdir(join(projectDir, 'skills', 'getting-started'), { recursive: true });
    await writeFileSafe(
      join(projectDir, 'skills', 'getting-started', 'SKILL.md'),
      generateStarterSkill(name),
    );

    spinner.text = 'Writing tools...';

    // Write starter tool
    await writeFileSafe(
      join(projectDir, 'tools', 'index.ts'),
      generateToolsIndex(),
    );
    await writeFileSafe(
      join(projectDir, 'tools', 'example-tool.ts'),
      generateExampleTool(),
    );

    // Write workflow if template supports it
    if (template === 'workflow') {
      await writeFileSafe(
        join(projectDir, 'workflows', 'example.lobster'),
        generateExampleWorkflow(name),
      );
    }

    spinner.text = 'Writing configuration files...';

    // Write package.json
    await writeFileSafe(
      join(projectDir, 'package.json'),
      JSON.stringify(generatePackageJson(name), null, 2) + '\n',
    );

    // Write tsconfig.json
    await writeFileSafe(
      join(projectDir, 'tsconfig.json'),
      JSON.stringify(generateTsConfig(), null, 2) + '\n',
    );

    // Write .gitignore
    await writeFileSafe(join(projectDir, '.gitignore'), generateGitignore());

    // Write README
    await writeFileSafe(join(projectDir, 'README.md'), generateReadme(name, template));

    spinner.succeed(chalk.green('Project created successfully!'));
  } catch (err) {
    spinner.fail('Failed to create project');
    logger.error(String(err));
    process.exit(1);
  }

  logger.blank();
  logger.section('Next steps');
  logger.blank();
  logger.code(`cd ${name}`);
  logger.code('pnpm install');
  logger.code('clawkit dev');
  logger.blank();
  console.log(
    chalk.dim('  Documentation: ') + chalk.cyan('https://github.com/clawkit/clawkit'),
  );
  logger.blank();
}

// ─────────────────────────────────────────────
// Template generators
// ─────────────────────────────────────────────

function generateManifest(name: string, template: string): string {
  return `# ClawKit Application Manifest
# Documentation: https://github.com/clawkit/clawkit/docs/manifest.md

name: ${name}
displayName: "${toTitleCase(name)}"
description: "A ClawKit agent application"
version: "0.1.0"

author:
  name: "Your Name"
  email: "you@example.com"

license: MIT

# Tool access policy
tools:
  profile: ${template === 'workflow' ? 'full' : 'coding'}
  allow:
    - browser

# Required capabilities (validated at build time)
requires:
  tools:
    - exec
    - read
    - write

# ClawKit metadata
clawkit:
  tags:
    - ${template}
  homepage: "https://github.com/your-org/${name}"
`;
}

function generateSoul(name: string, _template: string): string {
  return `# Soul — ${toTitleCase(name)}

You are ${toTitleCase(name)}, a helpful and thoughtful AI assistant.

## Personality

You are direct, efficient, and friendly. You communicate clearly without unnecessary verbosity.
You ask clarifying questions when needed, but you don't over-ask. You take initiative when
the user's intent is clear.

## Tone

- Professional but approachable
- Concise and to the point
- Honest about limitations and uncertainty

## Boundaries

- You do not perform actions that could harm the user or others
- You do not share sensitive information from memory with unauthorized parties
- You always confirm before taking irreversible actions
`;
}

function generateInstructions(name: string, _template: string): string {
  return `# Agent Instructions — ${toTitleCase(name)}

## Core Responsibilities

1. Help the user accomplish their goals efficiently
2. Maintain context across conversations using memory
3. Use available tools proactively when they would help

## Memory Management

- At the start of each session, read today's and yesterday's memory logs
- After completing significant tasks, append a brief note to the daily log
- Update MEMORY.md when you learn important long-term facts about the user

## Tool Usage

- Use the \`exec\` tool for running commands and scripts
- Use \`read\`/\`write\` for file operations
- Always confirm with the user before making irreversible changes

## Communication Style

- Keep responses concise unless detail is explicitly requested
- Use markdown formatting for structured content
- Provide status updates for long-running operations
`;
}

function generateUserProfile(): string {
  return `# User Profile

<!-- 
  This file is loaded at the start of every session.
  Fill in details about the user to help the agent personalize its responses.
-->

## About

Name: [Your name]
Role: [Your role / occupation]
Location: [Your timezone / location]

## Preferences

- Communication style: [e.g., direct, detailed, casual]
- Preferred language: [e.g., English]

## Context

[Add any relevant context about your work, projects, or goals]
`;
}

function generateStarterSkill(name: string): string {
  return `---
name: Getting Started
description: Orientation skill for ${toTitleCase(name)} — helps the agent understand its capabilities and initial setup.
user-invocable: false
metadata:
  openclaw:
    emoji: 🚀
    always: true
---

# Getting Started

This skill provides initial orientation for the ${toTitleCase(name)} agent.

## On First Session

When starting a fresh session with no prior context:

1. Greet the user warmly and introduce yourself as ${toTitleCase(name)}
2. Briefly mention your key capabilities
3. Ask how you can help today

## Available Capabilities

- File operations (read, write, edit files)
- Command execution (run scripts and commands)
- Web browsing (research and information gathering)
- Memory (remember context across sessions)

## Memory Initialization

At the start of each session:
1. Read \`memory/YYYY-MM-DD.md\` for today and yesterday
2. Read \`MEMORY.md\` for long-term context (private sessions only)
`;
}

function generateToolsIndex(): string {
  return `/**
 * Tool registry for ${' '}this ClawKit application.
 * Register all your custom tools here.
 */

import type { ToolDefinition } from '@openclaw-kit/core';
import { exampleTool } from './example-tool.js';

/**
 * All tools exported by this application.
 * These will be compiled into an OpenClaw Plugin by \`clawkit build\`.
 */
export const tools: ToolDefinition[] = [exampleTool];

export default function register(api: { registerTool: (name: string, spec: unknown) => void }) {
  for (const tool of tools) {
    api.registerTool(tool.name, tool);
  }
}
`;
}

function generateExampleTool(): string {
  return `/**
 * Example custom tool — replace with your own implementation.
 */

import { Tool, Field } from '@openclaw-kit/core';

/**
 * A simple echo tool that demonstrates the ClawKit Tool SDK.
 * Replace this with your own tool implementation.
 */
export const exampleTool = Tool.define({
  name: 'echo',
  description: 'Echoes the input message back to the agent. Replace this with a real tool.',
  schema: {
    message: Field.string('The message to echo back'),
    uppercase: Field.boolean('Whether to uppercase the message').default(false),
  },
  async execute({ message, uppercase }, ctx) {
    const result = uppercase ? message.toUpperCase() : message;

    // Example: log to daily memory
    await ctx.memory.appendDaily(\`echo tool called with: "\${message}"\`);

    return \`Echo: \${result}\`;
  },
});
`;
}

function generateExampleWorkflow(_name: string): string {
  return `# Example Lobster Workflow
# Documentation: https://docs.openclaw.ai/tools/lobster

name: example-workflow
description: An example workflow that demonstrates the Lobster pipeline format

steps:
  - id: gather_input
    description: Collect the required information from the user
    tools:
      - ask_user

  - id: process
    description: Process the gathered information
    tools:
      - exec
    approval: false

  - id: review
    description: Review the results before finalizing
    approval: true  # Requires human approval before proceeding

  - id: finalize
    description: Save the results and notify the user
    tools:
      - write
      - message
`;
}

function generatePackageJson(name: string): Record<string, unknown> {
  return {
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'clawkit dev',
      build: 'clawkit build',
      pack: 'clawkit pack',
      test: 'vitest run',
      typecheck: 'tsc --noEmit',
    },
    dependencies: {
      '@openclaw-kit/core': '^0.1.0',
    },
    devDependencies: {
      '@types/node': '^22.0.0',
      typescript: '^5.5.0',
      vitest: '^2.0.0',
    },
    engines: {
      node: '>=22.0.0',
    },
  };
}

function generateTsConfig(): Record<string, unknown> {
  return {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      lib: ['ES2022'],
      strict: true,
      declaration: true,
      sourceMap: true,
      esModuleInterop: true,
      skipLibCheck: true,
      resolveJsonModule: true,
    },
    include: ['tools/**/*', 'tests/**/*'],
    exclude: ['node_modules', 'dist'],
  };
}

function generateGitignore(): string {
  return `node_modules/
dist/
*.tsbuildinfo
.env
.env.local
.DS_Store
*.log
.clawkit/
`;
}

function generateReadme(name: string, template: string): string {
  return `# ${toTitleCase(name)}

> Built with [ClawKit](https://github.com/clawkit/clawkit) — the application framework for [OpenClaw](https://github.com/openclaw/openclaw).

## Overview

${toTitleCase(name)} is a ${template} agent application built on OpenClaw.

## Getting Started

### Prerequisites

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/get-started) installed and running

### Development

\`\`\`bash
pnpm install
clawkit dev
\`\`\`

### Build

\`\`\`bash
clawkit build
\`\`\`

### Deploy

\`\`\`bash
clawkit pack
openclaw app install ./dist/${name}.clawapp
\`\`\`

## Project Structure

\`\`\`
${name}/
├── clawapp.yaml          # Application manifest
├── persona/              # Agent identity and instructions
│   ├── soul.md           # Personality and tone
│   ├── instructions.md   # Operating instructions
│   └── user.md           # User profile
├── skills/               # Task-specific skill guides
├── tools/                # Custom tool implementations
└── workflows/            # Lobster workflow definitions
\`\`\`

## License

MIT
`;
}

function toTitleCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
