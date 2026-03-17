/**
 * clawkit info — Display information about the current ClawKit project
 */

import chalk from 'chalk';
import { findManifest, loadManifest, loadSkillsFromDir } from '@openclaw-kit/core';
import { join } from 'node:path';
import { logger } from '../utils/logger.js';
import { pathExists, findProjectRoot } from '../utils/fs.js';

export async function infoCommand(): Promise<void> {
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    logger.error('No ClawKit project found. Run `clawkit init` first.');
    process.exit(1);
  }

  const manifestPath = await findManifest(projectRoot);
  const manifest = await loadManifest(manifestPath);

  logger.blank();
  console.log(chalk.bold.cyan(`  🦞 ${manifest.displayName}`));
  console.log(chalk.dim('  ' + '─'.repeat(manifest.displayName.length + 2)));
  logger.blank();

  logger.kv('Name', manifest.name);
  logger.kv('Version', manifest.version);
  logger.kv('Description', manifest.description);
  if (manifest.author) {
    logger.kv('Author', manifest.author.name);
  }
  logger.kv('License', manifest.license);
  logger.blank();

  // Tool policy
  if (manifest.tools) {
    logger.section('Tool Policy');
    logger.blank();
    logger.kv('Profile', manifest.tools.profile);
    if (manifest.tools.allow?.length) {
      logger.kv('Allow', manifest.tools.allow.join(', '));
    }
    if (manifest.tools.deny?.length) {
      logger.kv('Deny', manifest.tools.deny.join(', '));
    }
    logger.blank();
  }

  // Sandbox
  if (manifest.sandbox) {
    logger.section('Sandbox');
    logger.blank();
    logger.kv('Mode', manifest.sandbox.mode);
    logger.kv('Backend', manifest.sandbox.backend);
    logger.blank();
  }

  // Skills
  const skillsDir = join(projectRoot, 'skills');
  if (await pathExists(skillsDir)) {
    const skills = await loadSkillsFromDir(skillsDir);
    if (skills.length > 0) {
      logger.section('Skills');
      logger.blank();
      for (const skill of skills) {
        const emoji = skill.meta.metadata?.openclaw?.emoji ?? '🔧';
        console.log(`  ${emoji} ${chalk.white(skill.meta.name)}`);
        console.log(chalk.dim(`     ${skill.meta.description}`));
      }
      logger.blank();
    }
  }

  // Bindings
  if (manifest.bindings?.length) {
    logger.section('Channel Bindings');
    logger.blank();
    for (const binding of manifest.bindings) {
      let desc = binding.channel;
      if (binding.accountId) desc += ` (account: ${binding.accountId})`;
      if (binding.peer) desc += ` → ${binding.peer.kind}:${binding.peer.id}`;
      console.log(`  • ${chalk.white(desc)}`);
    }
    logger.blank();
  }

  // Requirements
  if (manifest.requires) {
    logger.section('Requirements');
    logger.blank();
    if (manifest.requires.tools?.length) {
      logger.kv('Tools', manifest.requires.tools.join(', '));
    }
    if (manifest.requires.plugins?.length) {
      logger.kv('Plugins', manifest.requires.plugins.join(', '));
    }
    if (manifest.requires.env?.length) {
      logger.kv('Env vars', manifest.requires.env.join(', '));
    }
    logger.blank();
  }
}
