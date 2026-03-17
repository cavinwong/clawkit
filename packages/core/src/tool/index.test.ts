import { describe, it, expect, vi } from 'vitest';
import { Tool, Field, ToolRegistry } from './index.js';
import type { ToolContext } from '../types/index.js';

const mockContext: ToolContext = {
  agentId: 'test-agent',
  sessionKey: 'test-session',
  workspaceDir: '/tmp/test-workspace',
  memory: {
    readLongTerm: vi.fn().mockResolvedValue(''),
    appendDaily: vi.fn().mockResolvedValue(undefined),
    writeLongTerm: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue([]),
  },
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
};

describe('Field builders', () => {
  it('creates a required string field', () => {
    const field = Field.string('A test field');
    const def = field.build();
    expect(def.type).toBe('string');
    expect(def.description).toBe('A test field');
    expect(def.required).toBe(true);
  });

  it('creates an optional string field with default', () => {
    const field = Field.string('Optional field').default('hello');
    const def = field.build();
    expect(def.required).toBe(false);
    expect(def.default).toBe('hello');
  });

  it('creates a number field with constraints', () => {
    const field = Field.number('Count').min(1).max(100).integer();
    const def = field.build();
    expect(def.type).toBe('integer');
    expect((def as Record<string, unknown>).minimum).toBe(1);
    expect((def as Record<string, unknown>).maximum).toBe(100);
  });

  it('creates an enum field', () => {
    const field = Field.enum('Direction', ['north', 'south', 'east', 'west']);
    const def = field.build();
    expect(def.enum).toEqual(['north', 'south', 'east', 'west']);
  });
});

describe('Tool.define', () => {
  it('creates a tool with correct metadata', () => {
    const tool = Tool.define({
      name: 'test_tool',
      description: 'A test tool',
      schema: {
        message: Field.string('The message'),
      },
      async execute({ message }) {
        return `Echo: ${message}`;
      },
    });

    expect(tool.name).toBe('test_tool');
    expect(tool.description).toBe('A test tool');
    expect(tool.schema.message.type).toBe('string');
  });

  it('executes the tool and returns a string result', async () => {
    const tool = Tool.define({
      name: 'echo_tool',
      description: 'Echoes input',
      schema: {
        text: Field.string('Text to echo'),
      },
      async execute({ text }) {
        return `Echo: ${text}`;
      },
    });

    const result = await tool.execute({ text: 'hello' }, mockContext);
    expect(result).toBe('Echo: hello');
  });

  it('executes the tool and can call memory', async () => {
    const tool = Tool.define({
      name: 'memory_tool',
      description: 'Uses memory',
      schema: {
        note: Field.string('Note to save'),
      },
      async execute({ note }, ctx) {
        await ctx.memory.appendDaily(note);
        return 'Saved';
      },
    });

    await tool.execute({ note: 'test note' }, mockContext);
    expect(mockContext.memory.appendDaily).toHaveBeenCalledWith('test note');
  });
});

describe('ToolRegistry', () => {
  it('registers and retrieves tools', () => {
    const registry = new ToolRegistry();
    const tool = Tool.define({
      name: 'reg_tool',
      description: 'A registered tool',
      schema: {},
      async execute() {
        return 'ok';
      },
    });

    registry.register(tool);
    expect(registry.get('reg_tool')).toBe(tool);
    expect(registry.getAll()).toHaveLength(1);
  });

  it('throws on duplicate registration', () => {
    const registry = new ToolRegistry();
    const tool = Tool.define({
      name: 'dup_tool',
      description: 'Duplicate',
      schema: {},
      async execute() {
        return 'ok';
      },
    });

    registry.register(tool);
    expect(() => registry.register(tool)).toThrow('already registered');
  });

  it('generates valid JSON schema', () => {
    const registry = new ToolRegistry();
    const tool = Tool.define({
      name: 'schema_tool',
      description: 'Schema test',
      schema: {
        name: Field.string('Name'),
        age: Field.number('Age').optional(),
      },
      async execute() {
        return 'ok';
      },
    });

    registry.register(tool);
    const schema = registry.toJsonSchema('schema_tool');
    expect(schema).not.toBeNull();
    expect((schema as Record<string, unknown>).type).toBe('object');
    const required = (schema as Record<string, unknown>).required as string[];
    expect(required).toContain('name');
    expect(required).not.toContain('age');
  });
});
