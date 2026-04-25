import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens
        canvas: 'hsl(var(--color-canvas) / <alpha-value>)',
        surface: 'hsl(var(--color-surface) / <alpha-value>)',
        surfaceAlt: 'hsl(var(--color-surface-alt) / <alpha-value>)',
        stroke: 'hsl(var(--color-stroke) / <alpha-value>)',
        ink: 'hsl(var(--color-ink) / <alpha-value>)',
        muted: 'hsl(var(--color-muted) / <alpha-value>)',
        accent: {
          DEFAULT: 'hsl(var(--color-accent) / <alpha-value>)',
          soft: 'hsl(var(--color-accent-soft) / <alpha-value>)',
          strong: 'hsl(var(--color-accent-strong) / <alpha-value>)',
        },
        semanticSuccess: 'hsl(var(--color-success) / <alpha-value>)',
        semanticWarning: 'hsl(var(--color-warning) / <alpha-value>)',
        semanticDanger: 'hsl(var(--color-danger) / <alpha-value>)',
        // Financial theme colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // REIT specific colors
        reit: {
          atrium: '#2563eb',  // Blue for Atrium
          axis: '#16a34a',    // Green for Axis
          yield: '#22c55e',   // Yield green
          nav: '#3b82f6',     // NAV blue
          risk: {
            low: '#22c55e',
            medium: '#eab308',
            high: '#f97316',
            critical: '#ef4444',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // ---------------------------------------------------------------
        // COMPACT TYPOGRAPHY SCALE
        // Tuple form: [size, { lineHeight, letterSpacing?, fontWeight? }]
        // All tokens are tuned for dense, data-rich dashboard UI.
        // ---------------------------------------------------------------

        // --- Tailwind legacy tokens (compressed so un-migrated components
        //     also shrink without touching every call site) ---
        'xs':   ['0.75rem',   { lineHeight: '1rem' }],        // 12px  (unchanged — keeps form inputs legible, avoids iOS zoom regression)
        'sm':   ['0.8125rem', { lineHeight: '1.125rem' }],     // 13px  (was 14px)
        'base': ['0.8125rem', { lineHeight: '1.125rem' }],     // 13px  (was 16px)
        'lg':   ['0.9375rem', { lineHeight: '1.25rem' }],      // 15px  (was 18px)
        'xl':   ['1.0625rem', { lineHeight: '1.375rem' }],     // 17px  (was 20px)
        '2xl':  ['1.25rem',   { lineHeight: '1.5rem' }],       // 20px  (was 24px)
        '3xl':  ['1.5rem',    { lineHeight: '1.75rem' }],      // 24px  (was 30px)

        // --- Canonical semantic tokens ---
        '2xs':       ['0.5625rem',  { lineHeight: '0.75rem' }],                                  //  9px — tiny indicator badges
        'micro':     ['0.625rem',   { lineHeight: '0.75rem' }],                                  // 10px — captions, timestamps
        'label':     ['0.65625rem', { lineHeight: '0.875rem', letterSpacing: '0.08em', fontWeight: '500' }], // 10.5px — form labels, metadata (uppercase via plugin)
        'body-sm':   ['0.6875rem',  { lineHeight: '0.875rem' }],                                 // 11px — secondary text, card content
        'data':      ['0.75rem',    { lineHeight: '1rem' }],                                     // 12px — table cells, dense UI
        'metric-sm': ['0.8125rem',  { lineHeight: '1rem',     fontWeight: '600' }],              // 13px — small metrics
        'body':      ['0.8125rem',  { lineHeight: '1rem' }],                                     // 13px / 16px lh — body text, paragraphs (tight for dense UI)
        'metric':    ['0.9375rem',  { lineHeight: '1.25rem',  fontWeight: '600', letterSpacing: '-0.02em' }], // 15px — primary metrics, emphasis
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'panel': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'card-semantic': '0 1px 2px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04)',
        'elevated': '0 10px 30px rgba(15,23,42,.10), 0 2px 8px rgba(15,23,42,.06)',
      },
      // High contrast mode support
      screens: {
        'forced-colors': { 'raw': '(forced-colors: active)' },
      },
    },
  },
  plugins: [
    // Screen reader only utility
    function({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        },
      });
    },
    // Semantic typography behaviors that cannot be expressed in fontSize
    // tuple form (text-transform, font-variant-numeric).
    // These merge with the auto-generated font-size utilities above, so
    // `.text-label` ends up with: size + line-height + letter-spacing +
    // font-weight (from fontSize) + text-transform: uppercase (from here).
    function({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        '.text-label': {
          'text-transform': 'uppercase',
        },
        '.text-metric': {
          'font-variant-numeric': 'tabular-nums lining-nums',
        },
        '.text-metric-sm': {
          'font-variant-numeric': 'tabular-nums lining-nums',
        },
      });
    },
  ],
};

export default config;
