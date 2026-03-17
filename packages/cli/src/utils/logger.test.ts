import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger.js';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('exports a logger object with expected methods', () => {
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('success');
    expect(logger).toHaveProperty('warn');
    expect(logger).toHaveProperty('error');
    expect(logger).toHaveProperty('step');
    expect(logger).toHaveProperty('blank');
    expect(logger).toHaveProperty('section');
    expect(logger).toHaveProperty('kv');
    expect(logger).toHaveProperty('code');
  });

  it('logger.info calls console.log', () => {
    logger.info('test message');
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  it('logger.success calls console.log', () => {
    logger.success('done');
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  it('logger.warn calls console.warn', () => {
    logger.warn('warning');
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('logger.error calls console.error', () => {
    logger.error('error');
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('logger.step calls console.log', () => {
    logger.step(1, 3, 'step message');
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  it('logger.blank calls console.log with empty string', () => {
    logger.blank();
    expect(console.log).toHaveBeenCalledWith('');
  });

  it('logger.section calls console.log twice', () => {
    logger.section('My Section');
    expect(console.log).toHaveBeenCalledTimes(3);
  });

  it('logger.kv calls console.log', () => {
    logger.kv('key', 'value');
    expect(console.log).toHaveBeenCalledTimes(1);
  });
});
