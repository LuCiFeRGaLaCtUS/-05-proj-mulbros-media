/**
 * Master vertical registry — single source of truth for all 9 verticals.
 * Used by: Sidebar, OnboardingFlow, VerticalRouter, AgentSelector.
 */
export const VERTICALS = [
  {
    id:    'filmmaker',
    label: 'Filmmaker',
    sub:   'Full Cycle',
    icon:  'Clapperboard',
    color: 'emerald',
    neon:  '#34d399',
    desc:  'Financing, production, distribution & revenue',
  },
  {
    id:    'musician',
    label: 'Musician / Artist',
    sub:   'Music',
    icon:  'Music2',
    color: 'amber',
    neon:  '#fbbf24',
    desc:  'Marketing, sync pitching, audience growth',
  },
  {
    id:    'composer',
    label: 'Film / TV Composer',
    sub:   'Composer',
    icon:  'Piano',
    color: 'violet',
    neon:  '#a78bfa',
    desc:  'Lead gen, sync licensing, scoring workflow',
  },
  {
    id:    'actor',
    label: 'Actor',
    sub:   'Performance',
    icon:  'Drama',
    color: 'rose',
    neon:  '#fb7185',
    desc:  'Casting leads, marketing, audition tracking',
  },
  {
    id:    'screenwriter',
    label: 'Screenwriter',
    sub:   'Writing',
    icon:  'ScrollText',
    color: 'orange',
    neon:  '#fb923c',
    desc:  'Opportunity scouting, pitch tools, script intel',
  },
  {
    id:    'crew',
    label: 'Film / TV Crew',
    sub:   'Production',
    icon:  'Camera',
    color: 'slate',
    neon:  '#94a3b8',
    desc:  'Job leads for DPs, ADs, HMU, SFX, Gaffers & more',
  },
  {
    id:    'artist',
    label: 'Visual Artist',
    sub:   'Fine Art',
    icon:  'Palette',
    color: 'pink',
    neon:  '#f472b6',
    desc:  'Exhibition leads, grants, commissions',
  },
  {
    id:    'writer',
    label: 'Writer / Author',
    sub:   'Publishing',
    icon:  'BookOpen',
    color: 'teal',
    neon:  '#2dd4bf',
    desc:  'Query pitching, publishing, ARC campaigns',
  },
  {
    id:    'artsorg',
    label: 'Arts Organization',
    sub:   'Non-Profit',
    icon:  'Building2',
    color: 'indigo',
    neon:  '#818cf8',
    desc:  'Grants, audience development, donor outreach',
  },
];

export const getVerticalById = (id) => VERTICALS.find(v => v.id === id);

/** Color map matching verticals.js neon values — extend verticalColors.js tokens */
export const VERTICAL_NEON_MAP = Object.fromEntries(
  VERTICALS.map(v => [v.id, v.neon])
);
