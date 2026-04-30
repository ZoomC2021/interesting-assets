# Deployment

Deployment guide for the REIT Comparison Dashboard.

## Current Deployment Status

The REIT Comparison Dashboard uses **Next.js static export** for simple, fast deployment to any static hosting service.

## Deployment Strategy

The application is built as a static site (no server-side rendering required), making deployment straightforward:

1. Build generates static HTML/CSS/JS to `frontend/dist/`
2. Deploy the `dist/` folder to any static host
3. No server runtime or database required

## Build Process

```bash
# Install dependencies
make install

# Build data contract (type checking)
make build-contract

# Build frontend (includes citation verification)
make build-frontend

# Or build everything
make build
```

The build process:
1. Type-checks the data contract (`src/`)
2. Builds Next.js app with static export
3. Verifies citations are correctly linked
4. Outputs to `frontend/dist/`

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)

```bash
# Build first
cd frontend
npm install
npm run build

# Deploy with Wrangler
cd ..
npx wrangler pages deploy frontend/dist --project-name=reit-dashboard
```

### Option 2: Netlify

```bash
cd frontend
npm run build

# Deploy
cd dist
npx netlify deploy --prod --dir=.
```

Or connect GitHub repo to Netlify for auto-deploy on push.

### Option 3: GitHub Pages

```bash
cd frontend
npm run build

# Copy dist to docs folder for GitHub Pages
cp -r dist ../docs

# Push to GitHub (Pages serves from /docs or /root)
git add docs
git commit -m "Deploy to GitHub Pages"
git push
```

### Option 4: Vercel

Connect GitHub repository to Vercel:

1. Import project in Vercel dashboard
2. Set root directory to `frontend/`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy

### Option 5: AWS S3 + CloudFront

```bash
# Build
cd frontend
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache (if using)
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## Environment Variables

No runtime environment variables required. All configuration is build-time:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | ➖ | Base URL for absolute links |
| `NODE_ENV` | ➖ | Set to `production` for optimizations |

## Pre-Deployment Checklist

- [ ] All tests pass (`make test`)
- [ ] Type checking passes (`make typecheck-all`)
- [ ] Linting clean (`make lint`)
- [ ] Citation verification passes (`make verify-citations`)
- [ ] Audit citations (`make audit-citations`) - target >90% direct linkage
- [ ] Build succeeds without errors
- [ ] Manual smoke test of built files

## Post-Deployment Verification

1. **Homepage loads**: Verify Next.js app renders
2. **Monitor page**: Check all REITs display with sparklines
3. **Compare page**: Test side-by-side comparison functionality
4. **Entity page**: Verify individual REIT pages load
5. **Citation links**: Click citation links to verify they resolve

## Data Updates

When REIT data changes:

```bash
# 1. Update references JSON files
# 2. Run generation script
npx ts-node scripts/generate-samples.ts

# 3. Verify citations
make check-citations
make verify-citations

# 4. Rebuild and deploy
make build
# Deploy...
```

## Rollback Procedure

Since deployment is static file serving:

1. Keep previous `dist/` folder backup
2. Re-deploy previous `dist/` if issues detected
3. Or revert git commit and re-deploy

## CI/CD (Future)

Recommended GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: make install
      - run: make ci
      - run: make build-frontend
      - name: Deploy to Cloudflare Pages
        run: npx wrangler pages deploy frontend/dist --project-name=reit-dashboard
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Performance Considerations

- Static export enables CDN caching
- REIT JSON files loaded on-demand via dynamic imports
- Chart images (Recharts) rendered client-side
- No server cold starts

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails citation check | Run `make audit-citations` to find unlinked references |
| 404 on entity pages | Check `next.config.js` export settings |
| Missing REIT data | Verify `frontend/public/data/*.json` files exist post-build |
