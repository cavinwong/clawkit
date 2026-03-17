/**
 * @clawkit/core - Tool SDK
 *
 * Provides a fluent, type-safe API for defining OpenClaw tools.
 * Tools defined with this SDK are automatically compiled into
 * valid OpenClaw Plugin tool registrations.
 */

import { z } from 'zod';
import type {
  ToolContext,
  ToolDefinition,
  ToolResult,
  FieldDefinition,
} from '../types/index.js';

// ─────────────────────────────────────────────
// Field Builders
// ─────────────────────────────────────────────

/**
 * Fluent field builder for defining tool input parameters.
 *
 * @example
 * ```ts
 * const cityField = Field.string('The city name, e.g. "Beijing"');
 * const countField = Field.number('Number of results to return').default(10);
 * ```
 */
export const Field = {
  string(description: string): StringFieldBuilder {
    return new StringFieldBuilder(description);
  },
  number(description: string): NumberFieldBuilder {
    return new NumberFieldBuilder(description);
  },
  boolean(description: string): BooleanFieldBuilder {
    return new BooleanFieldBuilder(description);
  },
  enum<T extends string>(description: string, values: [T, ...T[]]): EnumFieldBuilder<T> {
    return new EnumFieldBuilder(description, values);
  },
};

abstract class BaseFieldBuilder<T> {
  protected _required = true;
  protected _default?: T;
  protected _description: string;

  constructor(description: string) {
    this._description = description;
  }

  optional(): this {
    this._required = false;
    return this;
  }

  default(value: T): this {
    this._default = value;
    this._required = false;
    return this;
  }

  abstract build(): FieldDefinition<T>;
}

class StringFieldBuilder extends BaseFieldBuilder<string> {
  private _minLength?: number;
  private _maxLength?: number;
  private _pattern?: string;

  minLength(n: number): this {
    this._minLength = n;
    return this;
  }

  maxLength(n: number): this {
    this._maxLength = n;
    return this;
  }

  pattern(regex: string): this {
    this._pattern = regex;
    return this;
  }

  build(): FieldDefinition<string> {
    return {
      type: 'string',
      description: this._description,
      required: this._required,
      ...(this._default !== undefined && { default: this._default }),
      ...(this._minLength !== undefined && { minLength: this._minLength }),
      ...(this._maxLength !== undefined && { maxLength: this._maxLength }),
      ...(this._pattern !== undefined && { pattern: this._pattern }),
    };
  }
}

class NumberFieldBuilder extends BaseFieldBuilder<number> {
  private _min?: number;
  private _max?: number;
  private _integer = false;

  min(n: number): this {
    this._min = n;
    return this;
  }

  max(n: number): this {
    this._max = n;
    return this;
  }

  integer(): this {
    this._integer = true;
    return this;
  }

  build(): FieldDefinition<number> {
    return {
      type: this._integer ? 'integer' : 'number',
      description: this._description,
      required: this._required,
      ...(this._default !== undefined && { default: this._default }),
      ...(this._min !== undefined && { minimum: this._min }),
      ...(this._max !== undefined && { maximum: this._max }),
    };
  }
}

class BooleanFieldBuilder extends BaseFieldBuilder<boolean> {
  build(): FieldDefinition<boolean> {
    return {
      type: 'boolean',
      description: this._description,
      required: this._required,
      ...(this._default !== undefined && { default: this._default }),
    };
  }
}

class EnumFieldBuilder<T extends string> extends BaseFieldBuilder<T> {
  private _values: [T, ...T[]];

  constructor(description: string, values: [T, ...T[]]) {
    super(description);
    this._values = values;
  }

  build(): FieldDefinition<T> {
    return {
      type: 'string',
      description: this._description,
      required: this._required,
      enum: this._values,
      ...(this._default !== undefined && { default: this._default }),
    };
  }
}

// ─────────────────────────────────────────────
// Tool Builder
// ─────────────────────────────────────────────

type SchemaBuilders = Record<string, BaseFieldBuilder<unknown>>;
type InferInput<S extends SchemaBuilders> = {
  [K in keyof S]: S[K] extends BaseFieldBuilder<infer T> ? T : never;
};

/**
 * Define a ClawKit tool with a fluent, type-safe API.
 *
 * @example
 * ```ts
 * export const fetchWeather = Tool.define({
 *   name: 'fetch_weather',
 *   description: 'Get the current weather for a city',
 *   schema: {
 *     city: Field.string('City name, e.g. "Beijing"'),
 *     units: Field.enum('Temperature units', ['celsius', 'fahrenheit']).default('celsius'),
 *   },
 *   async execute({ city, units }, ctx) {
 *     const data = await getWeather(city, units);
 *     await ctx.memory.appendDaily(`Checked weather for ${city}: ${data.condition}`);
 *     return `Weather in ${city}: ${data.condition}, ${data.temp}°`;
 *   },
 * });
 * ```
 */
export const Tool = {
  define<S extends SchemaBuilders>(config: {
    name: string;
    description: string;
    schema: S;
    execute(
      input: InferInput<S>,
      context: ToolContext,
    ): Promise<string | ToolResult>;
  }): ToolDefinition<InferInput<S>> {
    // Build the field definitions from the builders
    const builtSchema = Object.fromEntries(
      Object.entries(config.schema).map(([key, builder]) => [
        key,
        (builder as BaseFieldBuilder<unknown>).build(),
      ]),
    ) as Record<keyof InferInput<S>, FieldDefinition>;

    return {
      name: config.name,
      description: config.description,
      schema: builtSchema,
      execute: config.execute,
    };
  },
};

// ─────────────────────────────────────────────
// Tool Registry
// ─────────────────────────────────────────────

/**
 * A registry that collects tool definitions and generates
 * the OpenClaw Plugin registration code.
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): this {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }
    this.tools.set(tool.name, tool);
    return this;
  }

  registerMany(tools: ToolDefinition[]): this {
    for (const tool of tools) {
      this.register(tool);
    }
    return this;
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Generate the JSON Schema for a tool's input parameters.
   * This is used by the build step to create OpenClaw-compatible tool specs.
   */
  toJsonSchema(toolName: string): Record<string, unknown> | null {
    const tool = this.tools.get(toolName);
    if (!tool) return null;

    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, field] of Object.entries(tool.schema)) {
      const { required: isRequired, ...rest } = field as FieldDefinition & { required: boolean };
      properties[key] = rest;
      if (isRequired) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    };
  }

  /**
   * Generate the OpenClaw Plugin registration module source code.
   * This is called by the build step to produce the compiled plugin.
   */
  toPluginSource(): string {
    const toolSpecs = this.getAll().map((tool) => {
      const schema = this.toJsonSchema(tool.name);
      return JSON.stringify({
        name: tool.name,
        description: tool.description,
        schema,
      });
    });

    return `
// Auto-generated by @clawkit/core build step
// Do not edit this file directly.

export default function register(api) {
  ${toolSpecs
    .map(
      (spec, i) => `
  const tool${i} = ${spec};
  api.registerTool(tool${i}.name, {
    description: tool${i}.description,
    schema: tool${i}.schema,
    execute: async (input, context) => {
      const { tools } = await import('./tools.js');
      const tool = tools.find(t => t.name === tool${i}.name);
      if (!tool) throw new Error('Tool not found: ' + tool${i}.name);
      return tool.execute(input, context);
    },
  });`,
    )
    .join('\n')}
}
`.trim();
  }
}

// Zod-based schema inference helpers (for advanced users)
export { z };
export type { ToolDefinition, ToolContext, ToolResult, FieldDefinition };
