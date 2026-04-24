import React from 'react';
import { FileText, Clock, CheckCircle2 } from 'lucide-react';

// Platform presets per vertical. Generic baseline + vertical-specific adds.
export const PLATFORMS_BASE = [
  { key: 'instagram', label: 'Instagram'   },
  { key: 'tiktok',    label: 'TikTok'      },
  { key: 'twitter',   label: 'X / Twitter' },
  { key: 'linkedin',  label: 'LinkedIn'    },
  { key: 'youtube',   label: 'YouTube'     },
];

export const PLATFORMS_BY_VERTICAL = {
  musician:     [...PLATFORMS_BASE, { key: 'spotify',   label: 'Spotify'       }, { key: 'bandcamp',   label: 'Bandcamp' }, { key: 'soundcloud', label: 'SoundCloud' }],
  composer:     [...PLATFORMS_BASE, { key: 'soundcloud', label: 'SoundCloud'   }, { key: 'imdb',       label: 'IMDb Pro' }, { key: 'scorefolio', label: 'Scorefolio' }],
  filmmaker:    [...PLATFORMS_BASE, { key: 'imdb',      label: 'IMDb Pro'      }, { key: 'filmfreeway', label: 'FilmFreeway' }, { key: 'vimeo',     label: 'Vimeo' }],
  actor:        [...PLATFORMS_BASE, { key: 'imdb',      label: 'IMDb Pro'      }, { key: 'actorsaccess', label: 'Actors Access' }, { key: 'backstage', label: 'Backstage' }],
  screenwriter: [...PLATFORMS_BASE, { key: 'stage32',   label: 'Stage 32'      }, { key: 'substack',   label: 'Substack' },         { key: 'medium',    label: 'Medium' }],
  crew:         [...PLATFORMS_BASE, { key: 'imdb',      label: 'IMDb Pro'      }, { key: 'productionhub', label: 'ProductionHUB' },  { key: 'behance',  label: 'Behance' }],
  artist:       [...PLATFORMS_BASE, { key: 'behance',   label: 'Behance'       }, { key: 'artsy',      label: 'Artsy' },             { key: 'patreon',   label: 'Patreon' }],
  writer:       [...PLATFORMS_BASE, { key: 'substack',  label: 'Substack'      }, { key: 'goodreads',  label: 'Goodreads' },         { key: 'amazon',    label: 'Amazon KDP' }],
  artsorg:      [...PLATFORMS_BASE, { key: 'mailchimp', label: 'Mailchimp'     }, { key: 'eventbrite', label: 'Eventbrite' }],
};

export const platformsForVertical = (vertical) =>
  PLATFORMS_BY_VERTICAL[vertical] || PLATFORMS_BASE;

export const PLATFORM_STYLE = {
  instagram:     'bg-rose-50 text-rose-600 border-rose-200',
  tiktok:        'bg-cyan-50 text-cyan-700 border-cyan-200',
  twitter:       'bg-zinc-100 text-zinc-600 border-zinc-200',
  youtube:       'bg-red-50 text-red-600 border-red-200',
  spotify:       'bg-emerald-50 text-emerald-600 border-emerald-200',
  linkedin:      'bg-blue-50 text-blue-600 border-blue-200',
  imdb:          'bg-amber-50 text-amber-600 border-amber-200',
  filmfreeway:   'bg-orange-50 text-orange-600 border-orange-200',
  vimeo:         'bg-sky-50 text-sky-600 border-sky-200',
  soundcloud:    'bg-orange-50 text-orange-600 border-orange-200',
  scorefolio:    'bg-violet-50 text-violet-600 border-violet-200',
  bandcamp:      'bg-teal-50 text-teal-600 border-teal-200',
  stage32:       'bg-blue-50 text-blue-600 border-blue-200',
  substack:      'bg-orange-50 text-orange-600 border-orange-200',
  medium:        'bg-zinc-100 text-zinc-700 border-zinc-200',
  actorsaccess:  'bg-red-50 text-red-600 border-red-200',
  backstage:     'bg-zinc-100 text-zinc-700 border-zinc-200',
  productionhub: 'bg-slate-100 text-slate-700 border-slate-200',
  behance:       'bg-blue-50 text-blue-600 border-blue-200',
  artsy:         'bg-zinc-900 text-white border-zinc-900',
  patreon:       'bg-red-50 text-red-600 border-red-200',
  goodreads:     'bg-amber-50 text-amber-600 border-amber-200',
  amazon:        'bg-yellow-50 text-yellow-700 border-yellow-200',
  mailchimp:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  eventbrite:    'bg-orange-50 text-orange-600 border-orange-200',
};

export const STATUS_CFG = {
  draft:     { label: 'Draft',     badge: 'bg-zinc-100 text-zinc-500',             Icon: FileText,     next: 'scheduled', dot: 'bg-zinc-500'    },
  scheduled: { label: 'Scheduled', badge: 'bg-blue-500/10 text-blue-400',          Icon: Clock,        next: 'posted',    dot: 'bg-blue-400'    },
  posted:    { label: 'Posted',    badge: 'bg-emerald-500/10 text-emerald-400',    Icon: CheckCircle2, next: 'draft',     dot: 'bg-emerald-400' },
};

export const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const VioletBg = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-violet-50/40 via-white to-white pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 bg-violet-500/5 blur-xl rounded-full pointer-events-none" />
  </>
);
