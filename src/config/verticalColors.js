/**
 * Vertical color tokens — Hollywood × Cyberpunk 2077 neon palette.
 * Single source of truth — never define verticalColors locally in components.
 *
 * Extra tokens added for 2077 overhaul:
 *   glow  — CSS box-shadow string for neon glow effect
 *   neon  — raw hex color for inline style usage
 *   dim   — rgba string for background tints
 */
export const verticalColors = {
  financing: {
    bg:     'bg-blue-500/10',
    text:   'text-blue-300',
    border: 'border-blue-500/25',
    ring:   'border-blue-400/50',
    dot:    'bg-blue-400',
    hover:  'hover:border-blue-500/40 hover:bg-blue-500/5',
    glow:   '0 0 16px rgba(59,130,246,0.25)',
    neon:   '#60a5fa',
    ink:    '#1d4ed8', // AA on white — use for text
    dim:    'rgba(59,130,246,0.08)',
  },
  film: {
    bg:     'bg-emerald-500/10',
    text:   'text-emerald-300',
    border: 'border-emerald-500/25',
    ring:   'border-emerald-400/50',
    dot:    'bg-emerald-400',
    hover:  'hover:border-emerald-500/40 hover:bg-emerald-500/5',
    glow:   '0 0 16px rgba(16,185,129,0.25)',
    neon:   '#34d399',
    ink:    '#047857',
    dim:    'rgba(16,185,129,0.08)',
  },
  music: {
    bg:     'bg-amber-500/10',
    text:   'text-amber-300',
    border: 'border-amber-500/25',
    ring:   'border-amber-400/50',
    dot:    'bg-amber-400',
    hover:  'hover:border-amber-500/40 hover:bg-amber-500/5',
    glow:   '0 0 16px rgba(245,158,11,0.25)',
    neon:   '#fbbf24',
    ink:    '#b45309',
    dim:    'rgba(245,158,11,0.08)',
  },
  composer: {
    bg:     'bg-violet-500/10',
    text:   'text-violet-300',
    border: 'border-violet-500/25',
    ring:   'border-violet-400/50',
    dot:    'bg-violet-400',
    hover:  'hover:border-violet-500/40 hover:bg-violet-500/5',
    glow:   '0 0 16px rgba(139,92,246,0.25)',
    neon:   '#a78bfa',
    ink:    '#6d28d9',
    dim:    'rgba(139,92,246,0.08)',
  },
  community: {
    bg:     'bg-fuchsia-500/10',
    text:   'text-fuchsia-300',
    border: 'border-fuchsia-500/25',
    ring:   'border-fuchsia-400/50',
    dot:    'bg-fuchsia-400',
    hover:  'hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5',
    glow:   '0 0 16px rgba(217,70,239,0.25)',
    neon:   '#e879f9',
    ink:    '#a21caf',
    dim:    'rgba(217,70,239,0.08)',
  },
  strategy: {
    bg:     'bg-cyan-500/10',
    text:   'text-cyan-300',
    border: 'border-cyan-500/25',
    ring:   'border-cyan-400/50',
    dot:    'bg-cyan-400',
    hover:  'hover:border-cyan-500/40 hover:bg-cyan-500/5',
    glow:   '0 0 16px rgba(6,182,212,0.25)',
    neon:   '#22d3ee',
    ink:    '#0e7490',
    dim:    'rgba(6,182,212,0.08)',
  },
};
