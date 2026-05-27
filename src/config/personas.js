import {
  Mic2, Video, Mail, Wallet, Activity, ScrollText,
  Clapperboard, Film, Music2, Piano, Users, Radar,
} from 'lucide-react';

/**
 * Persona personalization — collapses 9 verticals into 3 nav personas.
 * Drives the ChatShell sidebar so an actor sees only acting nav,
 * a director sees only directing nav, a musician sees only music nav.
 *
 * Persona derived from profiles.vertical. Agency role is its own surface
 * (handled separately in ChatShell). Admin/super_admin see everything.
 */

export const PERSONA_BY_VERTICAL = {
  actor:        'actor',
  filmmaker:    'director',
  productions:  'director',
  crew:         'director',
  screenwriter: 'director',
  musician:     'musician',
  composer:     'musician',
  // artist / writer / artsorg fall through to default 'actor' talent nav
};

/**
 * Resolve a user's persona from their profile.
 * Agency role short-circuits to 'agency'. Otherwise map vertical → persona,
 * defaulting to 'actor' so nothing ever disappears entirely.
 */
export const getPersona = (profile) => {
  if (!profile) return 'actor';
  if ((profile.roles || []).includes('agency') && !(profile.roles || []).includes('talent')) {
    return 'agency';
  }
  return PERSONA_BY_VERTICAL[profile.vertical] || 'actor';
};

/**
 * Which /vertical/:slug routes a persona is allowed to visit.
 * Used by VerticalRouteGuard to permit a persona's whole group.
 */
export const VERTICALS_BY_PERSONA = {
  actor:    ['actor'],
  director: ['filmmaker', 'productions', 'crew', 'screenwriter'],
  musician: ['musician', 'composer'],
  agency:   ['filmmaker', 'productions', 'musician', 'actor', 'composer', 'crew'],
};

/**
 * Sidebar nav per persona. Each item: { label, icon, path, accent }.
 * accent drives the active-state color in ChatShell NavItem.
 */
export const NAV_BY_PERSONA = {
  actor: {
    label: 'Acting',
    accent: '#0ea5e9',
    items: [
      { label: 'Auditions',      icon: Mic2,       path: '/talent/auditions' },
      { label: 'Self-Tape',      icon: Video,      path: '/talent/self-tape' },
      { label: 'Agent Inbox',    icon: Mail,       path: '/talent/inbox' },
      { label: 'Income',         icon: Wallet,     path: '/talent/income' },
      { label: 'Industry Intel', icon: Activity,   path: '/talent/intel' },
      { label: 'Contracts',      icon: ScrollText, path: '/talent/contracts' },
    ],
  },
  director: {
    label: 'Directing',
    accent: '#34d399',
    items: [
      { label: 'Film Financing', icon: Film,         path: '/vertical/filmmaker' },
      { label: 'Productions',    icon: Clapperboard, path: '/vertical/productions' },
      { label: 'Crew',           icon: Users,        path: '/vertical/crew' },
      { label: 'Industry Intel', icon: Activity,     path: '/talent/intel' },
    ],
  },
  musician: {
    label: 'Music',
    accent: '#f59e0b',
    items: [
      { label: 'Music',          icon: Music2,    path: '/vertical/musician' },
      { label: 'Composer',       icon: Piano,     path: '/vertical/composer' },
      { label: 'Income',         icon: Wallet,    path: '/talent/income' },
      { label: 'Industry Intel', icon: Activity,  path: '/talent/intel' },
    ],
  },
};
