# Tool SDK

ClawKit provides a type-safe SDK for building OpenClaw tools. It automatically infers input types and generates the required JSON Schema for the LLM.

## Basic Usage

Tools are defined using `Tool.define()`. The `schema` object defines the inputs the LLM must provide.

```typescript
import { Tool, Field } from '@openclaw-kit/core';

export const weatherTool = Tool.define({
  name: 'get_weather',
  description: 'Get the current weather for a location',
  schema: {
    location: Field.string('City name'),
    celsius: Field.boolean('Use Celsius').default(true),
  },
  async execute({ location, celsius }, ctx) {
    // location is typed as `string`
    // celsius is typed as `boolean`
    
    return `Weather in ${location} is 22°${celsius ? 'C' : 'F'}`;
  },
});
```

## Field Types

The `Field` builder provides several types:

- `Field.string(description)`
- `Field.number(description)`
- `Field.boolean(description)`
- `Field.enum(description, ['val1', 'val2'])`

### Modifiers

You can chain modifiers to fields:

- `.optional()`: Makes the field optional.
- `.default(value)`: Sets a default value (makes it optional).
- `.min(val) / .max(val)`: For numbers.

## Tool Context

The second argument to `execute` is the `ToolContext`, which provides access to:

- `ctx.memory`: The Memory ORM for reading/writing agent memory.
- `ctx.log`: Logger for debugging (`ctx.log.info()`).
- `ctx.agentId`: The ID of the current agent.
- `ctx.sessionKey`: The current session ID.

## Compiling Tools

When you run `clawkit build`, all tools exported from `tools/index.ts` are automatically compiled into an OpenClaw Plugin using esbuild.
