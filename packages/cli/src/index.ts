/**
 * @openclaw-kit/cli — Programmatic API
 *
 * Exports the CLI commands as programmatic functions for use in
 * build tools, scripts, or custom tooling.
 */

export { initCommand, type InitOptions } from './commands/init.js';
export { addCommand, type AddTarget, type AddOptions } from './commands/add.js';
export { buildCommand, type BuildOptions } from './commands/build.js';
export { devCommand, type DevOptions } from './commands/dev.js';
export { packCommand, type PackOptions } from './commands/pack.js';
export { infoCommand } from './commands/info.js';
