import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithTimeout, postJson, getJson, HttpError, TimeoutError } from '../src/utils/http';

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the response when fetch resolves in time', async () => {
    const fake = { ok: true, status: 200, json: async () => ({ hello: 'world' }) };
    fetch.mockResolvedValueOnce(fake);
    const res = await fetchWithTimeout('/x', {}, 1000);
    expect(res).toBe(fake);
  });

  it('throws TimeoutError when the abort signal fires', async () => {
    fetch.mockImplementationOnce((_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      })
    );
    await expect(fetchWithTimeout('/slow', {}, 10)).rejects.toBeInstanceOf(TimeoutError);
  });

  it('re-throws non-abort errors unchanged', async () => {
    fetch.mockRejectedValueOnce(new Error('network down'));
    await expect(fetchWithTimeout('/x')).rejects.toThrow('network down');
  });
});

describe('postJson', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.restoreAllMocks());

  it('returns parsed body on 2xx', async () => {
    fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ ok: true, value: 42 }),
    });
    const data = await postJson('/api/thing', { a: 1 });
    expect(data.value).toBe(42);
  });

  it('throws HttpError on non-2xx with server message', async () => {
    fetch.mockResolvedValueOnce({
      ok: false, status: 400,
      json: async () => ({ error: { message: 'bad input' } }),
    });
    try {
      await postJson('/api/thing', {});
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect(err.status).toBe(400);
      expect(err.message).toBe('bad input');
    }
  });
});

describe('getJson', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it('returns parsed body on success', async () => {
    fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ x: 1 }) });
    const data = await getJson('/api/x');
    expect(data.x).toBe(1);
  });
});
