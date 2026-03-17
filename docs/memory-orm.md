# Memory ORM

The Memory ORM provides a structured, programmatic interface for interacting with OpenClaw's markdown-based memory files (`MEMORY.md` and `memory/YYYY-MM-DD.md`).

It is available inside the `execute` function of any custom tool via `ctx.memory`.

## Daily Log

The daily log is an append-only file for recording events, actions, and observations.

```typescript
// Append a note to today's log
await ctx.memory.appendDaily('Completed the code review for PR #42');

// Read today's log
const today = await ctx.memory.readDaily();

// Read today and yesterday (useful for context loading)
const recent = await ctx.memory.readRecentDays(2);
```

## Long-Term Memory (`MEMORY.md`)

Long-term memory is organized into named sections (denoted by `## Section Name` in the markdown file).

```typescript
// Read a specific section
const projects = await ctx.memory.readSection('Projects');

// Insert or update a section
await ctx.memory.upsertSection(
  'User Preferences',
  '- Prefers dark mode\n- Uses TypeScript'
);

// Append a single line to a section
await ctx.memory.appendToSection('Tasks', '- [ ] Write documentation');
```

## Search

The Memory ORM includes a basic text-based search across all memory files.

```typescript
const results = await ctx.memory.search('OpenClaw');

for (const result of results) {
  console.log(`Found in ${result.source}: ${result.content}`);
}
```
