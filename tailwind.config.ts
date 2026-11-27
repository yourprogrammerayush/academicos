import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Brand, sampled from the AcademicOS logo ───────────────── */
        navy: {
          50: '#F4F6FA',
          100: '#E4E9F2',
          200: '#C6D0E0',
          300: '#9AA9C1',
          400: '#6B7E9C',
          500: '#4A5C78',
          600: '#34445C',
          700: '#233047',
          800: '#1A2438',
          900: '#121A2A',
          950: '#0B1220',
        },
        amber: {
          50: '#FFF9EB',
          100: '#FFF0C7',
          200: '#FFE08A',
          300: '#FFCB4D',
          400: '#FCB81E',
          500: '#FCA800',   /* logo amber */
          600: '#E08C00',
          700: '#B86C00',
        },
        ember: {
          50: '#FFF4ED',
          100: '#FFE5D2',
          200: '#FFC7A5',
          300: '#FFA06D',
          400: '#FE7A38',
          500: '#FC6000',   /* logo orange */
          600: '#E24C00',
          700: '#B93B00',
        },
        coral: {
          50: '#FFF1F0',
          100: '#FFDEDA',
          200: '#FFC0B8',
          300: '#FF9588',
          400: '#FE6250',
          500: '#FC3A2C',   /* logo coral */
          600: '#E82418',
          700: '#BE1A10',
        },

        /* ── Semantic surfaces ─────────────────────────────────────── */
        canvas: 'rgb(var(--bg) / <alpha-value>)',
        sunken: 'rgb(var(--bg-sunken) / <alpha-value>)',
        mist: 'rgb(var(--bg-mist) / <alpha-value>)',
        elev: 'rgb(var(--bg-elev) / <alpha-value>)',
        hover: 'rgb(var(--bg-hover) / <alpha-value>)',
        active: 'rgb(var(--bg-active) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--fg-muted) / <alpha-value>)',
        faint: 'rgb(var(--fg-subtle) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          fg: 'rgb(var(--accent-fg) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
          line: 'rgb(var(--accent-line) / <alpha-value>)',
        },
        ok: { DEFAULT: 'rgb(var(--ok) / <alpha-value>)', soft: 'rgb(var(--ok-soft) / <alpha-value>)' },
        warn: { DEFAULT: 'rgb(var(--warn) / <alpha-value>)', soft: 'rgb(var(--warn-soft) / <alpha-value>)' },
        danger: { DEFAULT: 'rgb(var(--danger) / <alpha-value>)', soft: 'rgb(var(--danger-soft) / <alpha-value>)' },
      },
      fontFamily: {
        sans: ['"Jakarta"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Jakarta"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
      },
      letterSpacing: {
        tightest: '-0.035em',
        tighter: '-0.022em',
      },
      borderRadius: {
        xl2: '0.875rem',
        xl3: '1.125rem',
        '4xl': '1.75rem',
      },
      boxShadow: {
        /* Deliberately restrained — hairline first, shadow second. */
        hair: '0 0 0 1px rgba(11,18,32,0.06)',
        card: '0 1px 2px rgba(11,18,32,0.04), 0 0 0 1px rgba(11,18,32,0.05)',
        lift: '0 2px 4px rgba(11,18,32,0.04), 0 8px 20px -6px rgba(11,18,32,0.10), 0 0 0 1px rgba(11,18,32,0.05)',
        pop: '0 8px 16px -4px rgba(11,18,32,0.10), 0 24px 48px -12px rgba(11,18,32,0.18)',
        'inner-hair': 'inset 0 0 0 1px rgba(11,18,32,0.06)',
        glow: '0 0 0 4px rgba(252,96,0,0.12)',
      },
      transitionTimingFunction: {
        swift: 'cubic-bezier(0.22, 1, 0.36, 1)',
        snap: 'cubic-bezier(0.34, 1.3, 0.64, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.2s ease both',
        'sheet-up': 'sheet-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
