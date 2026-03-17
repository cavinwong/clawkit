# Application Manifest (`clawapp.yaml`)

The `clawapp.yaml` file is the central configuration for your ClawKit application. It replaces the need to manually manage OpenClaw's internal `openclaw-config.json` file.

## Example

```yaml
name: my-agent
displayName: "My Custom Agent"
description: "A helpful assistant"
version: "1.0.0"

author:
  name: "Your Name"

# Tool access policy
tools:
  profile: coding
  allow:
    - browser
    - exec
  deny:
    - write

# Channel bindings
bindings:
  - channel: telegram
    accountId: "@my_bot"
  - channel: slack
```

## Schema Reference

### `name` (Required)
The unique identifier for your application. Must be lowercase alphanumeric with hyphens.

### `displayName` (Required)
The human-readable name of your agent.

### `version` (Required)
Semantic version string (e.g., "1.0.0").

### `tools`
Configures which built-in OpenClaw tools the agent can access.
- `profile`: Base profile to inherit from (`default`, `coding`, `full`, `safe`).
- `allow`: List of specific tools to explicitly allow.
- `deny`: List of specific tools to explicitly deny.

### `bindings`
Configures which communication channels the agent should listen to.
- `channel`: The channel type (e.g., `telegram`, `slack`, `discord`).
- `accountId`: The specific account or bot ID to bind to.

### `requires`
Specifies dependencies that must be present in the OpenClaw environment for this app to run.
- `tools`: Required built-in tools.
- `plugins`: Required OpenClaw plugins.
- `env`: Required environment variables.
