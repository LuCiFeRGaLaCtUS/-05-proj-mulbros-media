/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          950: '#09090b',
          900: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
          600: '#52525b',
          500: '#71717a',
          400: '#a1a1aa',
          300: '#d4d4d8',
          200: '#e4e4e7',
          100: '#f4f4f5',
        },
        simara: {
          bg:        '#F5F6F8',
          surface:   '#FFFFFF',
          beige:     '#F3F1EC',
          line:      '#E0E0E0',
          line2:     '#F0F0F0',
          ink:       '#0B1D3A',
          muted:     '#888888',
          teal:      '#0F6E56',
          teal2:     '#5DCAA5',
          coral:     '#E24B4A',
        },
      },
      fontFamily: {
        sans:        ['Inter', 'system-ui', 'sans-serif'],
        mono:        ['DM Mono', 'JetBrains Mono', 'monospace'],
        'inter-tight': ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'simara-card':  '0 1px 3px rgba(11,29,58,0.04)',
        'simara-hover': '0 8px 24px rgba(11,29,58,0.08)',
        'simara-heavy': '0 12px 28px rgba(11,29,58,0.14)',
      },
    },
  },
  plugins: [],
}