/**
 * ClawKit CLI Logger
 * Provides consistent, styled terminal output.
 */

import chalk from 'chalk';

const CLAWKIT_PREFIX = chalk.cyan('🦞 clawkit');

export const logger = {
  info(message: string): void {
    console.log(`${CLAWKIT_PREFIX} ${chalk.white(message)}`);
  },

  success(message: string): void {
    console.log(`${CLAWKIT_PREFIX} ${chalk.green('✓')} ${chalk.white(message)}`);
  },

  warn(message: string): void {
    console.warn(`${CLAWKIT_PREFIX} ${chalk.yellow('⚠')} ${chalk.yellow(message)}`);
  },

  error(message: string): void {
    console.error(`${CLAWKIT_PREFIX} ${chalk.red('✗')} ${chalk.red(message)}`);
  },

  step(step: number, total: number, message: string): void {
    const counter = chalk.dim(`[${step}/${total}]`);
    console.log(`${CLAWKIT_PREFIX} ${counter} ${chalk.white(message)}`);
  },

  blank(): void {
    console.log('');
  },

  /** Print a section header */
  section(title: string): void {
    console.log('');
    console.log(chalk.bold.cyan(`  ${title}`));
    console.log(chalk.dim('  ' + '─'.repeat(title.length)));
  },

  /** Print a key-value pair */
  kv(key: string, value: string): void {
    console.log(`  ${chalk.dim(key + ':')} ${chalk.white(value)}`);
  },

  /** Print a code block */
  code(code: string): void {
    const lines = code.split('\n');
    for (const line of lines) {
      console.log(`  ${chalk.dim('│')} ${chalk.cyan(line)}`);
    }
  },
};
