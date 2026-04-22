// Structured logger — thin wrapper around console with consistent shape.
// In production, swap implementation for Sentry/Datadog without touching callsites.

const isProd = import.meta.env?.MODE === 'production';

const format = (level, action, data) => ({
  ts: new Date().toISOString(),
  level,
  action,
  ...(data && typeof data === 'object' ? data : { data }),
});

const emit = (level, action, data) => {
  const record = format(level, action, data);
  const fn = level === 'error' ? console.error
           : level === 'warn'  ? console.warn
           : console.log;
  if (isProd) {
    // Single-line JSON for log aggregators
    fn(JSON.stringify(record));
  } else {
    fn(`[${record.ts}] ${level.toUpperCase()} ${action}`, data ?? '');
  }
};

export const logger = {
  info:  (action, data) => emit('info',  action, data),
  warn:  (action, data) => emit('warn',  action, data),
  error: (action, err)  => {
    const payload = err instanceof Error
      ? { message: err.message, name: err.name, stack: err.stack }
      : err;
    emit('error', action, payload);
  },
};
