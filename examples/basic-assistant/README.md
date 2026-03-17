# Basic Assistant

> A general-purpose personal AI assistant — ClawKit example application

This example demonstrates the core ClawKit patterns for building a personal assistant agent on OpenClaw. It includes web research and task management skills, plus two custom tools (word counter and timestamp utility).

## What's included

| Component | Description |
| :--- | :--- |
| `persona/soul.md` | Agent personality and tone definition |
| `persona/instructions.md` | Operating instructions and memory management |
| `skills/web-research/` | Guides systematic web research |
| `skills/task-management/` | Simple task tracking via memory files |
| `tools/word-count.ts` | Analyzes text length and reading time |
| `tools/timestamp.ts` | Timezone-aware date/time utilities |

## Getting started

```bash
# Install dependencies
pnpm install

# Start development mode (builds and watches for changes)
clawkit dev

# Test the agent
openclaw agent --message "What are my tasks for today?"
```

## Building and deploying

```bash
# Build for production
clawkit build

# Package for distribution
clawkit pack

# Install on your OpenClaw instance
openclaw app install ./basic-assistant-0.1.0.clawapp
```

## Customization

Edit the persona files to change the agent's behavior:

- **`persona/soul.md`** — Personality, tone, and ethical boundaries
- **`persona/instructions.md`** — Operating procedures and tool usage guidelines
- **`persona/user.md`** — Information about you (loaded every session)

Add new skills with:

```bash
clawkit add skill my-new-skill
```

Add new tools with:

```bash
clawkit add tool my-new-tool
```
