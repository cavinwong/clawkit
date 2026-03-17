---
name: Data Pipeline
description: Guides the agent in running multi-step data processing pipelines with human approval gates.
user-invocable: true
metadata:
  openclaw:
    emoji: ⚙️
    requires:
      bins:
        - python3
---

# Data Pipeline

This skill guides the execution of multi-step data processing workflows using Lobster pipelines.

## When to use this skill

Use this skill when the user asks you to:
- Process a dataset through multiple transformation steps
- Run a workflow that requires human review before completion
- Execute a scheduled automation pipeline
- Coordinate a sequence of dependent operations

## Pipeline Execution Pattern

When running a data pipeline:

1. **Validate inputs**: Check that all required files and parameters are present
2. **Show the plan**: Present the pipeline steps to the user before executing
3. **Execute steps**: Run each step in sequence, logging progress
4. **Pause for approval**: At approval gates, present results and wait for confirmation
5. **Handle errors**: If a step fails, explain the error and ask how to proceed
6. **Summarize results**: After completion, provide a summary of what was processed

## Lobster Workflow Integration

To trigger a Lobster workflow, use the lobster tool:
```
lobster run daily-report
```

To check workflow status:
```
lobster status
```

## Error Handling

If a pipeline step fails:
1. Log the error clearly
2. Show the partial results so far
3. Offer options: retry, skip, or abort
4. Never proceed past an approval gate without explicit confirmation
