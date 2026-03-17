# Daily Report Workflow
# Generates a daily summary report and sends it to the user.
# Triggered via cron or manually by the user.
#
# Documentation: https://docs.openclaw.ai/tools/lobster

name: daily-report
description: Generate a daily summary report from memory and recent activity

steps:
  - id: read_memory
    description: Read today's and yesterday's memory logs to gather activity data
    tools:
      - read
    approval: false

  - id: gather_tasks
    description: Extract open and completed tasks from MEMORY.md
    tools:
      - read
    approval: false

  - id: generate_report
    description: >
      Synthesize the memory data into a structured daily report including:
      completed tasks, open items, key decisions, and tomorrow's priorities.
    tools:
      - exec
    approval: false

  - id: review_report
    description: Present the generated report to the user for review before sending
    approval: true

  - id: send_report
    description: Save the approved report to a file and optionally send via messaging
    tools:
      - write
      - message
    approval: false
