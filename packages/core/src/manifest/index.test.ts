import { describe, it, expect } from 'vitest';
import { parseManifest, manifestToOpenClawConfig, ManifestValidationError } from './index.js';

const validManifest = {
  name: 'my-agent',
  displayName: 'My Agent',
  description: 'A test agent',
  version: '1.0.0',
  license: 'MIT',
};

describe('parseManifest', () => {
  it('parses a valid manifest', () => {
    const manifest = parseManifest(validManifest);
    expect(manifest.name).toBe('my-agent');
    expect(manifest.displayName).toBe('My Agent');
    expect(manifest.version).toBe('1.0.0');
  });

  it('throws on invalid name format', () => {
    expect(() =>
      parseManifest({ ...validManifest, name: 'My Agent With Spaces' }),
    ).toThrow(ManifestValidationError);
  });

  it('throws on missing required fields', () => {
    expect(() => parseManifest({ name: 'my-agent' })).toThrow(ManifestValidationError);
  });

  it('applies defaults for optional fields', () => {
    const manifest = parseManifest(validManifest);
    expect(manifest.license).toBe('MIT');
  });

  it('parses tool policy', () => {
    const manifest = parseManifest({
      ...validManifest,
      tools: { profile: 'coding', allow: ['browser'] },
    });
    expect(manifest.tools?.profile).toBe('coding');
    expect(manifest.tools?.allow).toContain('browser');
  });

  it('parses channel bindings', () => {
    const manifest = parseManifest({
      ...validManifest,
      bindings: [{ channel: 'telegram' }],
    });
    expect(manifest.bindings?.[0]?.channel).toBe('telegram');
  });
});

describe('manifestToOpenClawConfig', () => {
  it('generates a valid OpenClaw config fragment', () => {
    const manifest = parseManifest(validManifest);
    const config = manifestToOpenClawConfig(manifest);
    expect(config.agents).toBeDefined();
    const agents = config.agents as Record<string, unknown>;
    const list = agents.list as Array<Record<string, unknown>>;
    expect(list[0]?.id).toBe('my-agent');
    expect(list[0]?.label).toBe('My Agent');
  });

  it('includes bindings in config when defined', () => {
    const manifest = parseManifest({
      ...validManifest,
      bindings: [{ channel: 'telegram' }],
    });
    const config = manifestToOpenClawConfig(manifest);
    const agents = config.agents as Record<string, unknown>;
    expect(agents.bindings).toBeDefined();
  });
});
