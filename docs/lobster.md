# Lobster Workflows

ClawKit has first-class support for OpenClaw's [Lobster](https://docs.openclaw.ai/tools/lobster) workflow engine. Lobster allows you to define deterministic, multi-step pipelines that the agent can execute.

## Creating a Workflow

Use the CLI to scaffold a new workflow:

```bash
clawkit add workflow my-pipeline
```

This creates a `workflows/my-pipeline.lobster` file.

## Workflow Syntax

Workflows are defined in YAML format. Here is an example:

```yaml
name: daily-report
description: Generate a daily summary report

steps:
  - id: gather_data
    description: Read recent memory logs
    tools:
      - read
    approval: false

  - id: generate
    description: Create the report
    tools:
      - exec
    approval: false

  - id: review
    description: Present the report to the user for review
    approval: true  # Requires human confirmation

  - id: send
    description: Save and send the final report
    tools:
      - write
      - message
```

## Using Workflows

Once defined, the agent can trigger workflows using the built-in `lobster` tool:

```
Agent: I will now run the daily report workflow.
> lobster run daily-report
```

If a step has `approval: true`, the workflow will pause and wait for the user to explicitly confirm before proceeding to the next step.
