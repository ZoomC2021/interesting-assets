import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './data/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'hsl(var(--canvas) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        'surface-alt': 'hsl(var(--surface-alt) / <alpha-value>)',
        surfaceAlt: 'hsl(var(--surface-alt) / <alpha-value>)',
        stroke: 'hsl(var(--stroke) / <alpha-value>)',
        'stroke-strong': 'hsl(var(--stroke-strong) / <alpha-value>)',
        strokeStrong: 'hsl(var(--stroke-strong) / <alpha-value>)',
        ink: 'hsl(var(--ink) / <alpha-value>)',
        'ink-muted': 'hsl(var(--ink-muted) / <alpha-value>)',
        'ink-faint': 'hsl(var(--ink-faint) / <alpha-value>)',
        muted: 'hsl(var(--ink-muted) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-hover': 'hsl(var(--accent-hover) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
        highlight: 'hsl(var(--highlight) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        data: ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
        serif: ['"Source Serif 4"', 'serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      boxShadow: {
        popover:
          '0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 0 0 1px hsl(var(--stroke))',
        card: '0 1px 2px rgba(0, 0, 0, 0.04), 0 10px 24px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
