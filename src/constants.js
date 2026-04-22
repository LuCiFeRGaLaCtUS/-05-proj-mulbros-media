// Central constants — keep magic numbers and string keys out of component bodies.

export const STORAGE_KEYS = {
  openAiKey:       'mulbros_openai_key',
  anthropicKey:    'mulbros_anthropic_key',
  settings:        'mulbros_settings',
  integrations:    'mulbros_integration_toggles',
  calendar:        'mulbros_calendar_v1',
};

export const SESSION = {
  durationDays:    7,
  durationMinutes: 7 * 24 * 60, // 10080
};

export const API_TIMEOUTS_MS = {
  default:  15_000,
  ai:       30_000,
  search:   25_000,
  weather:  10_000,
  supabase: 12_000,
};

export const UI = {
  countUpMs:        1400,
  timeUpdateMs:     60_000,
  pipelineSyncMs:   800,
  searchDebounceMs: 250,
};

export const LIMITS = {
  maxInputChars:   4000,
  chatHistoryMax:  200,
};

/**
 * Typography scale (documentation — Tailwind classes used directly in JSX).
 *
 * Floor rule: any readable text must be ≥11px. Decorative non-information
 * visuals can stay below but should be aria-hidden.
 */
export const TYPOGRAPHY = {
  micro:  'text-[11px]',  // ALL-CAPS chip labels, tracking ≥0.18em
  meta:   'text-xs',      // 12px — timestamps, sub-labels, table headers
  body:   'text-sm',      // 14px — default body, buttons, inputs
  bodyLg: 'text-[15px]',  // 15px — agent chat bubble body
  h4:     'text-base',    // 16px — card titles
  h3:     'text-lg',      // 18px — section heads
  h2:     'text-xl',      // 20px — page heads
  h2Lg:   'text-2xl',     // 24px
};
