import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MemoryStore, parseSections, serializeSections } from './index.js';

describe('parseSections', () => {
  it('parses sections from markdown', () => {
    const md = `## Projects\n\n- ClawKit\n\n## Notes\n\nSome notes`;
    const sections = parseSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0]?.heading).toBe('Projects');
    expect(sections[0]?.content).toContain('ClawKit');
    expect(sections[1]?.heading).toBe('Notes');
  });

  it('handles empty content', () => {
    const sections = parseSections('');
    expect(sections).toHaveLength(0);
  });
});

describe('serializeSections', () => {
  it('round-trips sections correctly', () => {
    const original = `## Projects\n\n- ClawKit\n\n## Notes\n\nSome notes`;
    const sections = parseSections(original);
    const serialized = serializeSections(sections);
    expect(serialized).toContain('## Projects');
    expect(serialized).toContain('ClawKit');
    expect(serialized).toContain('## Notes');
  });
});

describe('MemoryStore', () => {
  let tmpDir: string;
  let store: MemoryStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'clawkit-test-'));
    store = new MemoryStore({ workspaceDir: tmpDir });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('reads empty long-term memory', async () => {
    const content = await store.readLongTerm();
    expect(content).toBe('');
  });

  it('writes and reads long-term memory', async () => {
    await store.writeLongTerm('# Memory\n\n## Projects\n\n- ClawKit');
    const content = await store.readLongTerm();
    expect(content).toContain('ClawKit');
  });

  it('upserts a new section', async () => {
    await store.upsertSection('Projects', '- ClawKit: Active');
    const section = await store.readSection('Projects');
    expect(section).toContain('ClawKit');
  });

  it('updates an existing section', async () => {
    await store.upsertSection('Projects', '- ClawKit: Active');
    await store.upsertSection('Projects', '- ClawKit: Completed');
    const section = await store.readSection('Projects');
    expect(section).toContain('Completed');
    expect(section).not.toContain('Active');
  });

  it('appends to a section', async () => {
    await store.upsertSection('Notes', '- Note 1');
    await store.appendToSection('Notes', '- Note 2');
    const section = await store.readSection('Notes');
    expect(section).toContain('Note 1');
    expect(section).toContain('Note 2');
  });

  it('appends to daily log', async () => {
    await store.appendDaily('Test note');
    const daily = await store.readDaily();
    expect(daily).toContain('Test note');
  });

  it('searches memory by keyword', async () => {
    await store.upsertSection('Projects', '- ClawKit is an awesome framework');
    const results = await store.search('awesome');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.content).toContain('awesome');
  });
});
