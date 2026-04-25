/**
 * - Dev: no static export, default `.next` — avoids HMR + `output: 'export'`
 *   fighting the same `dist` tree as `next build`.
 * - `next build`: `output: 'export'` and `distDir: 'dist'` (NODE_ENV=production).
 */
const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: isDev ? '.next' : 'dist',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  ...(!isDev && { output: 'export' }),
};

module.exports = nextConfig;
