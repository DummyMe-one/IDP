# 🚀 Quick Start — Connect to Your Supabase

## ✅ Your Supabase is Connected

The application is configured to connect to:
- **URL**: `https://nlmynmcbjmnyqbbbprkx.supabase.co`
- **Anon Key**: Configured ✓

## 📋 Next Step: Run Database Migration

You need to apply the database schema to your Supabase project. Here's how:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/nlmynmcbjmnyqbbbprkx)
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Paste it into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for it to complete (~5 seconds)

### Option 2: Via Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref nlmynmcbjmnyqbbbprkx

# Push migrations
supabase db push
```

## 🔐 Configure Authentication

After applying the migration:

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Make sure **Email** provider is enabled
3. Go to **Authentication** → **URL Configuration**
4. Set these URLs:
   - **Site URL**: Your deployed URL (e.g., `https://yourusername.github.io/yourrepo/`)
   - **Redirect URLs**: 
     ```
     https://yourusername.github.io/yourrepo/**
     http://localhost:3000/**
     ```

## 🧪 Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:3000`
3. You should see the landing page
4. A green "Supabase Status: Connected" indicator will appear in the bottom-left corner (dev mode only)
5. Click "Get started" → Register a new account
6. Verify your email (check your inbox in Supabase Dashboard → Authentication)
7. Complete the vault setup
8. You're in! 🎉

## 🔒 Security Note

Your `.env` file contains your Supabase credentials. The **anon key** is safe to use in frontend code — it's designed for that. However:

- ❌ **NEVER** use the `SUPABASE_SECRET_KEY` (service role key) in frontend code
- ✅ The anon key has limited permissions and is protected by RLS policies
- ✅ All sensitive operations go through RLS-protected database queries
- ✅ The secret key is only used in Supabase Edge Functions (server-side)

## 📊 Verify Tables Were Created

After running the migration, verify in Supabase Dashboard:

1. Go to **Table Editor** in the sidebar
2. You should see these tables:
   - `profiles`
   - `user_vaults`
   - `user_crypto_keys`
   - `workspaces`
   - `workspace_members`
   - `workspace_invitations`
   - `projects`
   - `project_members`
   - `project_key_envelopes`
   - `environments`
   - `encrypted_secrets`
   - `branches`
   - `tasks`
   - `integration_connections`
   - `audit_events`

3. Go to **Authentication** → **Policies** to verify RLS is enabled on all tables

## 🐛 Troubleshooting

### "Connection failed" error
- Check that your Supabase project is active (not paused)
- Verify the URL and anon key in `.env` are correct
- Check browser console for detailed error messages

### "Table does not exist" error
- You need to run the database migration first (see above)
- Go to Supabase Dashboard → SQL Editor and run the migration

### Email verification not working
- Check Supabase Dashboard → Authentication → Email Templates
- Verify the redirect URLs are configured correctly
- Check your spam folder for the verification email

### Can't sign up
- Make sure Email provider is enabled in Supabase Dashboard
- Check that "Confirm email" is enabled for email auth
