# Configuration

Configuration files for TypeScript, Tailwind CSS, Jest, and Next.js.

## TypeScript Configuration

### Root (`tsconfig.json`)

Standard Node.js TypeScript configuration with strict mode enabled.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Frontend (`frontend/tsconfig.json`)

Next.js-specific TypeScript with path aliases.

Key settings:
- `jsx: "preserve"` — Next.js handles JSX transformation
- `baseUrl: "."` — Enables path aliases
- `paths: {"@/*": ["./*"]}` — `@/` maps to `frontend/`

## Tailwind CSS Configuration

### `frontend/tailwind.config.ts`

Custom theme extending Tailwind with project-specific design tokens.

```typescript
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        // Text tokens
        ink: 'var(--color-ink)',
        'ink-muted': 'var(--color-ink-muted)',
      },
    },
  },
  plugins: [],
};
```

CSS custom properties (in `frontend/app/globals.css`):

```css
:root {
  --color-canvas: #0f172a;
  --color-surface: #1e293b;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-ink: #f8fafc;
  --color-ink-muted: #94a3b8;
}
```

## Jest Configuration

### Root (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};
```

### Frontend (`frontend/jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
};
```

Setup file (`frontend/jest.setup.js`):

```javascript
import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
```

## Next.js Configuration

### `frontend/next.config.js`

Static export configuration for deployment.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // Clean URLs
};

module.exports = nextConfig;
```

## ESLint Configuration

### `frontend/eslint.config.mjs`

```javascript
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default tseslint.config(
  eslint.configs.recommended,
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // Project-specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  }
);
```

## Key Source Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | Root TypeScript configuration |
| `frontend/tsconfig.json` | Frontend TypeScript with path aliases |
| `frontend/tailwind.config.ts` | Tailwind CSS theme and tokens |
| `frontend/app/globals.css` | Global styles and CSS custom properties |
| `jest.config.js` | Root Jest configuration |
| `frontend/jest.config.js` | Frontend Jest with jsdom |
| `frontend/jest.setup.js` | Test setup (jest-dom, jest-axe) |
| `frontend/next.config.js` | Next.js static export config |
| `frontend/eslint.config.mjs` | ESLint rules |
| `frontend/postcss.config.js` | PostCSS with Tailwind and autoprefixer |
