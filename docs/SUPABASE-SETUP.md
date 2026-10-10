# Supabase Setup

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Note your project URL and anon/public key

## Configuration

### Environment Variables

Create `.env` (not committed):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_BASE_PATH=/
```

### GitHub Repository Variables

For CI/CD, set these as repository variables (not secrets):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_BASE_PATH`

If either value is missing or still a placeholder, the site deploys a setup notice
instead of attempting signup against an invalid endpoint. After setting both
variables, run the Pages workflow again. The publishable key is intended for browser
use; never put a service-role or secret key in a `VITE_` variable.

## Database Setup

### 1. Apply Migrations

```bash
# Using Supabase CLI
supabase link --project-ref your-project-ref
supabase db push

# Or manually via SQL editor
# Run every SQL file in supabase/migrations in filename order
```

Migration `002_create_profile_on_signup.sql` creates a profile from signup
metadata inside Supabase. Apply it before enabling registration in the app.

### 2. Verify RLS

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

### 3. Test Authentication

Enable email auth in Supabase Dashboard:
- Authentication → Providers → Email
- Enable "Confirm email"

### 4. Configure Auth Callbacks

Set the site URL and redirect URLs:
- Site URL: `https://dummyme-one.github.io/IDP/`
- Redirect URLs: `https://dummyme-one.github.io/IDP/**`

Signup explicitly redirects email confirmation to the current site URL. For the
GitHub Pages deployment, the confirmation link should return to
`https://dummyme-one.github.io/IDP/`, not `localhost`. Keep that URL in the
Supabase redirect allow list; the local development URL can be added separately
if you test signup locally.

## Auth Configuration

### Email Templates

Customize email templates in Supabase Dashboard → Authentication → Email Templates:
- Magic Link / Confirm signup
- Reset password

Ensure callback URLs use hash-based routing:
```
{{ .SiteURL }}/#/verify-email?token={{ .Token }}
{{ .SiteURL }}/#/reset-password?token={{ .Token }}
```

## Edge Functions (Optional)

For GitHub integration sync:

```bash
supabase functions deploy github-sync
supabase functions deploy invite-member
```

Set function secrets:
```bash
supabase secrets set GITHUB_APP_ID=xxx
supabase secrets set GITHUB_PRIVATE_KEY=xxx
```

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] No service-role key in frontend code
- [ ] Auth callbacks configured for hash routing
- [ ] Email confirmation enabled
- [ ] Rate limiting configured
- [ ] Audit logging active
