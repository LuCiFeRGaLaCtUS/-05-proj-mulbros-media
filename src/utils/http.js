// HTTP utilities — fetch with timeout + structured error handling.
// Every client-side call that hits an external or proxy endpoint should use fetchWithTimeout
// so the UI never hangs indefinitely on a slow/unresponsive upstream.

const DEFAULT_TIMEOUT_MS = 15_000;

export class HttpError extends Error {
  constructor(message, { status = 0, body = null, cause = null } = {}) {
    super(message);
    this.name   = 'HttpError';
    this.status = status;
    this.body   = body;
    this.cause  = cause;
  }
}

export class TimeoutError extends Error {
  constructor(ms) {
    super(`Request timed out after ${ms}ms`);
    this.name = 'TimeoutError';
    this.timeoutMs = ms;
  }
}

/**
 * fetch wrapper with AbortController-backed timeout.
 * Throws TimeoutError on timeout, HttpError on non-2xx, or re-throws network errors.
 */
export const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') throw new TimeoutError(timeoutMs);
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

/** Convenience: POST JSON with timeout, return parsed body or throw HttpError. */
export const postJson = async (url, body, { timeoutMs = DEFAULT_TIMEOUT_MS, headers = {} } = {}) => {
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpError(
      data?.error?.message || data?.error || `Request failed (${response.status})`,
      { status: response.status, body: data },
    );
  }
  return data;
};

/** Convenience: GET JSON with timeout. */
export const getJson = async (url, { timeoutMs = DEFAULT_TIMEOUT_MS, headers = {} } = {}) => {
  const response = await fetchWithTimeout(url, { headers }, timeoutMs);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpError(
      data?.error?.message || data?.error || `Request failed (${response.status})`,
      { status: response.status, body: data },
    );
  }
  return data;
};
