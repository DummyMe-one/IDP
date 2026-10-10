# GitHub Pages Deployment

## Setup

### 1. Repository Settings

In your GitHub repository:
- Settings → Pages → Source: GitHub Actions
- Settings → Variables → Add:
  - `VITE_SUPABASE_URL` = your Supabase URL
  - `VITE_SUPABASE_PUBLISHABLE_KEY` = your anon key
  - `VITE_BASE_PATH` = `/your-repo-name/` (or `/` for user/org pages)

### 2. Base Path Configuration

The `VITE_BASE_PATH` variable controls asset paths. Examples:
- User site (`username.github.io`): `VITE_BASE_PATH=/`
- Project site (`username.github.io/repo`): `VITE_BASE_PATH=/repo/`

### 3. Custom Domain (Optional)

If using a custom domain:
- Set `VITE_BASE_PATH=/`
- Add CNAME file to `public/`
- Configure DNS per GitHub docs

## Deployment Workflow

The workflow (`.github/workflows/deploy.yml`):
1. Triggers on push to `main` or manual dispatch
2. Installs dependencies from lockfile
3. Runs TypeScript type checking
4. Builds production frontend
5. Validates output (dist/index.html exists)
6. Uploads Pages artifact
7. Deploys via `actions/deploy-pages`

This is the only workflow that should deploy the site. Uploading the repository
root instead of `dist` publishes the unbuilt `index.html`, whose `/src/main.tsx`
entry point is not available on GitHub Pages.

## Routing

Uses **hash-based routing** (`HashRouter`) for GitHub Pages compatibility.
All routes work without server-side configuration:
- `/#/` — Dashboard
- `/#/login` — Login
- `/#/projects` — Projects
- `/#/settings` — Settings

## Supabase Auth Callbacks

Configure redirect URLs in Supabase:
```
https://your-username.github.io/your-repo/#/verify-email
https://your-username.github.io/your-repo/#/reset-password
```

## Verification

After deployment:
1. Visit the GitHub Pages URL
2. Verify the app loads without 404 errors
3. Check browser console for errors
4. Test auth flow (signup, login, email verification)
5. Verify deep links work (refresh on `/#/settings`)

## Security Checks

The build does NOT include:
- Supabase service-role keys
- Database passwords
- Server-side encryption keys
- OAuth client secrets

Repository variables are public after build. Only use publishable/anon keys.
