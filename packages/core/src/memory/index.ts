/**
 * @openclaw-kit/core - Memory ORM
 *
 * A lightweight abstraction over OpenClaw's file-based memory system.
 * Allows tools to read and write structured data to the agent's memory
 * while maintaining human-readable Markdown format.
 *
 * OpenClaw memory files:
 *   - MEMORY.md          → long-term curated memory
 *   - memory/YYYY-MM-DD.md → daily append-only log
 */

import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { MemoryContext, MemorySearchResult } from '../types/index.js';

// ─────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────

function todayString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ─────────────────────────────────────────────
// Memory Section Parser
// ─────────────────────────────────────────────

/**
 * Represents a named section within a Markdown memory file.
 * Sections are delimited by H2 headings (## Section Name).
 */
export interface MemorySection {
  heading: string;
  content: string;
}

/**
 * Parse a Markdown file into named sections.
 * Sections are split by H2 headings (## ...).
 */
export function parseSections(markdown: string): MemorySection[] {
  if (!markdown.trim()) return [];

  const lines = markdown.split('\n');
  const sections: MemorySection[] = [];
  let currentHeading = '__preamble__';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentLines.length > 0 || currentHeading !== '__preamble__') {
        sections.push({
          heading: currentHeading,
          content: currentLines.join('\n').trim(),
        });
      }
      currentHeading = line.slice(3).trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0 || currentHeading !== '__preamble__') {
    sections.push({
      heading: currentHeading,
      content: currentLines.join('\n').trim(),
    });
  }

  return sections;
}

/**
 * Serialize sections back into Markdown.
 */
export function serializeSections(sections: MemorySection[]): string {
  return sections
    .map((s) =>
      s.heading === '__preamble__'
        ? s.content
        : `## ${s.heading}\n\n${s.content}`,
    )
    .join('\n\n')
    .trim() + '\n';
}

// ─────────────────────────────────────────────
// MemoryStore — the main ORM class
// ─────────────────────────────────────────────

/**
 * Options for creating a MemoryStore instance.
 */
export interface MemoryStoreOptions {
  /** Path to the agent workspace directory */
  workspaceDir: string;
}

/**
 * MemoryStore provides a structured interface for reading and writing
 * to the agent's Markdown-based memory files.
 *
 * @example
 * ```ts
 * const memory = new MemoryStore({ workspaceDir: '~/.openclaw/workspace' });
 *
 * // Append a note to today's daily log
 * await memory.appendDaily('Completed code review for PR #42');
 *
 * // Write a structured record to a named section in MEMORY.md
 * await memory.upsertSection('Projects', '- **ClawKit**: Active development');
 *
 * // Read a specific section
 * const projects = await memory.readSection('Projects');
 * ```
 */
export class MemoryStore implements MemoryContext {
  private workspaceDir: string;

  constructor(options: MemoryStoreOptions) {
    this.workspaceDir = options.workspaceDir;
  }

  private get longTermPath(): string {
    return join(this.workspaceDir, 'MEMORY.md');
  }

  private get dailyDir(): string {
    return join(this.workspaceDir, 'memory');
  }

  private dailyPath(date = todayString()): string {
    return join(this.dailyDir, `${date}.md`);
  }

  // ── Long-term memory ──────────────────────

  /**
   * Read the full content of MEMORY.md.
   * Returns an empty string if the file doesn't exist.
   */
  async readLongTerm(): Promise<string> {
    try {
      return await readFile(this.longTermPath, 'utf-8');
    } catch {
      return '';
    }
  }

  /**
   * Overwrite the full content of MEMORY.md.
   */
  async writeLongTerm(content: string): Promise<void> {
    await mkdir(dirname(this.longTermPath), { recursive: true });
    await writeFile(this.longTermPath, content, 'utf-8');
  }

  /**
   * Read a specific named section from MEMORY.md.
   * Returns null if the section doesn't exist.
   */
  async readSection(heading: string): Promise<string | null> {
    const content = await this.readLongTerm();
    const sections = parseSections(content);
    const section = sections.find((s) => s.heading === heading);
    return section?.content ?? null;
  }

  /**
   * Insert or update a named section in MEMORY.md.
   * If the section exists, its content is replaced.
   * If it doesn't exist, a new section is appended.
   */
  async upsertSection(heading: string, content: string): Promise<void> {
    const existing = await this.readLongTerm();
    const sections = parseSections(existing);
    const idx = sections.findIndex((s) => s.heading === heading);

    if (idx >= 0) {
      sections[idx] = { heading, content };
    } else {
      sections.push({ heading, content });
    }

    await this.writeLongTerm(serializeSections(sections));
  }

  /**
   * Append a line to a named section in MEMORY.md.
   * Creates the section if it doesn't exist.
   */
  async appendToSection(heading: string, line: string): Promise<void> {
    const existing = await this.readSection(heading);
    const newContent = existing ? `${existing}\n${line}` : line;
    await this.upsertSection(heading, newContent);
  }

  // ── Daily log ─────────────────────────────

  /**
   * Append a timestamped note to today's daily memory log.
   * Creates the file and directory if they don't exist.
   */
  async appendDaily(note: string): Promise<void> {
    const path = this.dailyPath();
    await mkdir(this.dailyDir, { recursive: true });

    const timestamp = new Date().toISOString();
    const entry = `\n- [${timestamp}] ${note}\n`;

    // Ensure the file has a header on first write
    try {
      await readFile(path);
      await appendFile(path, entry, 'utf-8');
    } catch {
      const header = `# Memory Log — ${todayString()}\n`;
      await writeFile(path, header + entry, 'utf-8');
    }
  }

  /**
   * Read the daily memory log for a given date (defaults to today).
   */
  async readDaily(date?: string): Promise<string> {
    try {
      return await readFile(this.dailyPath(date), 'utf-8');
    } catch {
      return '';
    }
  }

  /**
   * Read the daily logs for today and yesterday combined.
   * This mirrors the recommended OpenClaw memory loading pattern.
   */
  async readRecentDays(days = 2): Promise<string> {
    const results: string[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const content = await this.readDaily(dateStr);
      if (content) {
        results.push(`### ${dateStr}\n\n${content}`);
      }
    }
    return results.join('\n\n');
  }

  // ── Search (basic keyword, extensible to vector) ──

  /**
   * Search memory files for a keyword or phrase.
   * This is a simple text-based search; for semantic search,
   * use a Context Engine plugin with vector capabilities.
   */
  async search(query: string): Promise<MemorySearchResult[]> {
    const results: MemorySearchResult[] = [];
    const queryLower = query.toLowerCase();

    const longTerm = await this.readLongTerm();
    const sections = parseSections(longTerm);

    for (const section of sections) {
      if (section.content.toLowerCase().includes(queryLower)) {
        // Simple relevance score based on occurrence count
        const occurrences = (
          section.content.toLowerCase().match(new RegExp(queryLower, 'g')) ?? []
        ).length;
        results.push({
          content: section.content,
          source: `MEMORY.md#${section.heading}`,
          score: Math.min(occurrences / 10, 1),
        });
      }
    }

    // Also search recent daily logs
    const recent = await this.readRecentDays(7);
    if (recent.toLowerCase().includes(queryLower)) {
      results.push({
        content: recent,
        source: 'memory/recent',
        score: 0.5,
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }
}

export type { MemoryContext, MemorySearchResult };
