import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from '../src/lib/logger';

describe('logger', () => {
  afterEach(() => vi.restoreAllMocks());

  it('emits info through console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test.action', { a: 1 });
    expect(spy).toHaveBeenCalled();
  });

  it('emits warn through console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test.warn', { reason: 'x' });
    expect(spy).toHaveBeenCalled();
  });

  it('serializes Error instances without crashing', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => logger.error('boom', new Error('fail'))).not.toThrow();
    expect(spy).toHaveBeenCalled();
  });
});
