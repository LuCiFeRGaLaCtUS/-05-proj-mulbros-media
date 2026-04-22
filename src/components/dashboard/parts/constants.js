import {
  Clapperboard, Music2, Piano, Drama, ScrollText, Camera, Palette, BookOpen, Building2,
} from 'lucide-react';

export const C = {
  gold:    '#f59e0b',
  blue:    '#3b82f6',
  emerald: '#10b981',
  purple:  '#8b5cf6',
  red:     '#ef4444',
  rose:    '#f43f5e',
};

export const REVENUE_DATA = [
  { month: 'Oct', financing: 12000, music: 4500,  productions: 8000  },
  { month: 'Nov', financing: 18000, music: 6200,  productions: 11000 },
  { month: 'Dec', financing: 15000, music: 8000,  productions: 14000 },
  { month: 'Jan', financing: 24000, music: 9500,  productions: 18000 },
  { month: 'Feb', financing: 28000, music: 12000, productions: 22000 },
  { month: 'Mar', financing: 30000, music: 14000, productions: 25000 },
];

export const PLATFORM_DATA = [
  { name: 'Spotify', value: 85230 },
  { name: 'TikTok',  value: 45800 },
  { name: 'Apple',   value: 34100 },
  { name: 'YouTube', value: 12400 },
];

export const PLATFORM_COLORS = [C.gold, C.purple, C.rose, C.blue];

export const V_ICON = {
  filmmaker:    Clapperboard,
  musician:     Music2,
  composer:     Piano,
  actor:        Drama,
  screenwriter: ScrollText,
  crew:         Camera,
  artist:       Palette,
  writer:       BookOpen,
  artsorg:      Building2,
};

export const VERTICAL_PATH = {
  filmmaker:    '/vertical/filmmaker',
  musician:     '/vertical/musician',
  composer:     '/vertical/composer',
  actor:        '/vertical/actor',
  screenwriter: '/vertical/screenwriter',
  crew:         '/vertical/crew',
  artist:       '/vertical/artist',
  writer:       '/vertical/writer',
  artsorg:      '/vertical/artsorg',
};
