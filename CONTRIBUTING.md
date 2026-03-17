# Contributing to ClawKit

First off, thank you for considering contributing to ClawKit! It's people like you that make open source such a great community.

## Development Setup

This project uses [pnpm](https://pnpm.io/) workspaces to manage multiple packages in a monorepo.

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 9.0.0

### Getting Started

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build all packages:
   ```bash
   pnpm build
   ```

## Monorepo Structure

- `packages/core`: The core SDK, types, and manifest parser.
- `packages/cli`: The command-line interface (`clawkit`).
- `packages/create-app`: The interactive project scaffolder.
- `examples/*`: Example applications used for testing and demonstration.

## Scripts

From the root directory, you can run:

- `pnpm build`: Builds all packages
- `pnpm test`: Runs tests across all packages
- `pnpm typecheck`: Runs TypeScript type checking
- `pnpm lint`: Runs ESLint
- `pnpm format`: Formats code with Prettier

## Submitting Changes

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/my-awesome-feature
   ```
2. Make your changes, ensuring tests pass (`pnpm test`).
3. If you've changed the public API or added a feature, update the documentation.
4. Create a changeset to document your changes (this is required for releasing):
   ```bash
   pnpm changeset
   ```
5. Commit your changes:
   ```bash
   git commit -m "feat: add awesome feature"
   ```
6. Push to your fork and submit a Pull Request.

## Coding Standards

- We use TypeScript for all code. Please ensure strict mode is enabled and avoid `any` where possible.
- We use ESLint and Prettier for code formatting. Run `pnpm format` before committing.
- For new features, please add unit tests (we use Vitest).

## License

By contributing to ClawKit, you agree that your contributions will be licensed under its MIT License.
