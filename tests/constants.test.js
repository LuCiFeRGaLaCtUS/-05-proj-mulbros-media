import { describe, it, expect } from 'vitest';
import { STORAGE_KEYS, SESSION, API_TIMEOUTS_MS, UI, LIMITS } from '../src/constants';

describe('constants', () => {
  it('storage keys are namespaced to mulbros_', () => {
    for (const v of Object.values(STORAGE_KEYS)) {
      expect(v).toMatch(/^mulbros_/);
    }
  });

  it('session duration minutes matches durationDays * 24 * 60', () => {
    expect(SESSION.durationMinutes).toBe(SESSION.durationDays * 24 * 60);
  });

  it('API timeouts are positive millisecond numbers', () => {
    for (const v of Object.values(API_TIMEOUTS_MS)) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
  });

  it('UI timings + limits are positive', () => {
    for (const v of Object.values(UI))      expect(v).toBeGreaterThan(0);
    for (const v of Object.values(LIMITS))  expect(v).toBeGreaterThan(0);
  });
});
