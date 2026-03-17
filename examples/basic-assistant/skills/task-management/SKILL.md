---
name: Task Management
description: Helps the agent manage tasks, to-do lists, and project tracking using memory files.
user-invocable: true
metadata:
  openclaw:
    emoji: ✅
---

# Task Management

This skill provides a simple task management system using the agent's memory files.

## Task Storage

Tasks are stored in `MEMORY.md` under a `## Tasks` section using this format:

```markdown
## Tasks

- [ ] Task description — due: YYYY-MM-DD — priority: high|medium|low
- [x] Completed task — completed: YYYY-MM-DD
```

## Commands

The user can ask you to:
- **Add a task**: "Add a task to review the PR by Friday"
- **List tasks**: "What are my open tasks?" or "Show my task list"
- **Complete a task**: "Mark the PR review task as done"
- **Prioritize**: "What should I work on today?"

## Workflow

When adding a task:
1. Parse the task description, due date (if mentioned), and priority
2. Read the current `## Tasks` section from `MEMORY.md`
3. Append the new task in the correct format
4. Confirm to the user with a summary

When listing tasks:
1. Read the `## Tasks` section from `MEMORY.md`
2. Group by priority (high → medium → low)
3. Show overdue tasks prominently
4. Suggest the top 3 tasks to work on today

## Daily Review

When the user asks "what should I work on today?":
1. Read all open tasks
2. Consider due dates and priorities
3. Suggest 3-5 tasks in priority order
4. Note any overdue items
