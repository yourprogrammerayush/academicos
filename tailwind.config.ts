import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B1220',
          900: '#0F1B2D',
          800: '#16233A',
          700: '#1E2F4D',
        },
        brand: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          soft: '#EFF6FF',
        },
        paper: '#FFFFFF',
        mist: '#F7F8FA',
        line: '#E6E8EE',
        linedark: '#22304D',
      },
      fontFamily: {
        serif: ['"Academic Serif"', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,27,45,0.06)',
        pop: '0 12px 32px rgba(15,27,45,0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
