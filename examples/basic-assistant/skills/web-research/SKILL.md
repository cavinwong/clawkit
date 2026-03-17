---
name: Web Research
description: Guides the agent in conducting thorough web research using the browser tool.
user-invocable: true
metadata:
  openclaw:
    emoji: 🔍
    requires:
      bins:
        - openclaw-browser
---

# Web Research

This skill guides systematic web research using the OpenClaw browser tool.

## When to use this skill

Use this skill when the user asks you to:
- Look up current information, news, or facts
- Research a topic in depth
- Compare products, services, or options
- Find documentation or technical references

## Research Process

1. **Plan the search**: Identify 2-3 key search queries that cover different angles of the topic
2. **Execute searches**: Use the browser tool to search and visit relevant pages
3. **Evaluate sources**: Prefer official documentation, reputable news sources, and academic references
4. **Synthesize findings**: Combine information from multiple sources into a coherent summary
5. **Cite sources**: Always include URLs for key claims

## Quality Standards

A good research response includes:
- A direct answer to the user's question
- Supporting evidence from 2+ sources
- Source URLs for verification
- Any important caveats or limitations

## Memory

After completing research, append a note to the daily memory log:
```
Researched: [topic] — [key finding]
```
