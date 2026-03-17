<div align="center">

# 🦞 ClawKit

**The Application Development Framework for OpenClaw**

[![npm version](https://img.shields.io/npm/v/@openclaw-kit/core.svg?style=flat-square)](https://www.npmjs.com/package/@openclaw-kit/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

## Overview

**ClawKit** is an open-source, high-level application development framework built on top of [OpenClaw](https://github.com/openclaw/openclaw). It provides developers with a structured, type-safe, and declarative way to build, test, and distribute AI Agent applications.

While OpenClaw serves as the foundational "Agent OS" (handling LLM routing, sandboxing, and context engines), ClawKit acts as the "App SDK"—abstracting away complex configurations and letting you focus on what makes your agent unique: its **Persona**, **Skills**, and **Tools**.

## Features

- **🚀 Zero-Config Scaffolding**: Create a new agent application in seconds with `create-clawkit-app`.
- **📦 Declarative Manifest**: Define your agent's identity, permissions, and channel bindings in a single `clawapp.yaml` file.
- **🛠️ Type-Safe Tool SDK**: Write custom tools in TypeScript with automatic schema generation and validation.
- **🧠 Memory ORM**: A lightweight abstraction for interacting with OpenClaw's markdown-based memory system.
- **🔄 Standardized Build Pipeline**: Compile TypeScript tools, validate skills, and package everything into a distributable `.clawapp` archive with a single command.
- **🦞 Lobster Workflow Support**: First-class support for defining multi-step automation pipelines.

## Getting Started

### 1. Create a new project

The easiest way to start is using the interactive scaffold:

```bash
npm create clawkit-app@latest my-agent
# or
pnpm create clawkit-app my-agent
```

Choose from templates like **Basic Assistant**, **Team Bot**, or **Workflow Agent**.

### 2. Start development mode

```bash
cd my-agent
pnpm install
pnpm dev
```

This will watch your files and automatically rebuild your agent when changes are detected.

### 3. Build and package

When you're ready to deploy your agent:

```bash
# Build the project into OpenClaw-compatible output
pnpm build

# Package into a distributable .clawapp archive
pnpm pack
```

### 4. Install on OpenClaw

```bash
openclaw app install ./my-agent-0.1.0.clawapp
```

## Project Structure

A standard ClawKit project looks like this:

```
my-agent/
├── clawapp.yaml          # Application manifest (identity, permissions, bindings)
├── persona/              # Natural language definitions
│   ├── soul.md           # Personality and core tone
│   └── instructions.md   # Operating procedures
├── skills/               # Agent Skills (SKILL.md)
│   └── web-research/
├── tools/                # Custom TypeScript tools
│   ├── index.ts          # Tool registry
│   └── custom-tool.ts    # Tool implementation
└── workflows/            # Lobster workflow definitions
    └── daily-report.lobster
```

## Core Concepts

### The Manifest (`clawapp.yaml`)

The central configuration file that defines your application. It replaces the need to manually manage OpenClaw's internal JSON configurations.

```yaml
name: my-agent
displayName: "My Custom Agent"
version: "1.0.0"

tools:
  profile: coding
  allow: [browser, exec]

bindings:
  - channel: telegram
```

### The Tool SDK

ClawKit provides a type-safe SDK for building OpenClaw plugins. It automatically infers input types and generates the required JSON Schema.

```typescript
import { Tool, Field } from '@openclaw-kit/core';

export const weatherTool = Tool.define({
  name: 'get_weather',
  description: 'Get the current weather for a location',
  schema: {
    location: Field.string('City name'),
    celsius: Field.boolean('Use Celsius').default(true),
  },
  async execute({ location, celsius }, ctx) {
    // Strongly typed inputs!
    const temp = await fetchWeather(location);
    
    // Interact with agent memory
    await ctx.memory.appendDaily(`Checked weather for ${location}`);
    
    return `The weather in ${location} is ${temp}°${celsius ? 'C' : 'F'}`;
  },
});
```

### The Memory ORM

Interact with OpenClaw's markdown-based memory system programmatically:

```typescript
// Inside a tool execute function:
await ctx.memory.appendDaily('Completed the code review');
await ctx.memory.upsertSection('Projects', '- **ClawKit**: Active');
const facts = await ctx.memory.search('preferences');
```

## Packages

This repository is a monorepo containing the following packages:

- [`@openclaw-kit/core`](./packages/core) — The core SDK, types, and manifest parser.
- [`@openclaw-kit/cli`](./packages/cli) — The command-line interface for building and packing apps.
- [`create-clawkit-app`](./packages/create-app) — The interactive project scaffolder.

## Examples

Check out the [`examples/`](./examples) directory for complete application templates:

- **[Basic Assistant](./examples/basic-assistant)**: A general-purpose personal AI.
- **[Workflow Agent](./examples/workflow-agent)**: An automation-focused agent using Lobster pipelines.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to set up the development environment and submit pull requests.

## License

[MIT](LICENSE) © ClawKit Contributors
