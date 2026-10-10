-- Supabase Migration: 001_initial_schema.sql
-- Internal Developer Portal - Database Schema
-- Fixed: All tables created first, then RLS policies added after

-- ─── Extensions ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════
-- PHASE 1: Create all tables (no policies yet)
-- ═══════════════════════════════════════════════════════════════════

-- ─── Profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── User Vaults ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_vaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_vault_key TEXT NOT NULL,
  kdf_salt TEXT NOT NULL,
  kdf_algorithm TEXT NOT NULL DEFAULT 'argon2id',
  kdf_version INTEGER NOT NULL DEFAULT 1,
  kdf_params JSONB NOT NULL DEFAULT '{}',
  recovery_envelope TEXT,
  crypto_version TEXT NOT NULL DEFAULT '1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── User Crypto Keys ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_crypto_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── Workspaces ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Workspace Members ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ─── Workspace Invitations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Projects ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  repository_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'paused')),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  encryption_initialized BOOLEAN NOT NULL DEFAULT FALSE,
  key_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);

-- ─── Project Members ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ─── Project Key Envelopes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_key_envelopes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_project_key TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ─── Environments ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS environments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('development', 'testing', 'staging', 'production')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- ─── Encrypted Secrets ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS encrypted_secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  environment_id UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  nonce TEXT NOT NULL,
  crypto_version TEXT NOT NULL DEFAULT '1',
  key_version INTEGER NOT NULL DEFAULT 1,
  is_secret BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(environment_id, variable_name)
);

-- ─── Branches ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  repository_ref TEXT,
  commit_sha TEXT,
  commit_message TEXT,
  commit_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_synced BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- ─── Tasks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Integration Connections ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'gitlab', 'jira', 'slack')),
  status TEXT NOT NULL DEFAULT 'setup_required' CHECK (status IN ('connected', 'disconnected', 'error', 'setup_required')),
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, provider)
);

-- ─── Audit Events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'failure')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- PHASE 2: Enable RLS on all tables
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_crypto_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_key_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- PHASE 3: Create RLS policies (all tables exist now)
-- ═══════════════════════════════════════════════════════════════════

-- ─── Profiles Policies ──────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── User Vaults Policies ───────────────────────────────────────────
DROP POLICY IF EXISTS "user_vaults_select_own" ON user_vaults;
DROP POLICY IF EXISTS "user_vaults_insert_own" ON user_vaults;
DROP POLICY IF EXISTS "user_vaults_update_own" ON user_vaults;

CREATE POLICY "user_vaults_select_own" ON user_vaults
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_vaults_insert_own" ON user_vaults
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_vaults_update_own" ON user_vaults
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── User Crypto Keys Policies ──────────────────────────────────────
DROP POLICY IF EXISTS "user_crypto_keys_select_own" ON user_crypto_keys;
DROP POLICY IF EXISTS "user_crypto_keys_insert_own" ON user_crypto_keys;
DROP POLICY IF EXISTS "user_crypto_keys_update_own" ON user_crypto_keys;
DROP POLICY IF EXISTS "user_crypto_keys_select_comembers" ON user_crypto_keys;

CREATE POLICY "user_crypto_keys_select_own" ON user_crypto_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_crypto_keys_insert_own" ON user_crypto_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_crypto_keys_update_own" ON user_crypto_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_crypto_keys_select_comembers" ON user_crypto_keys
  FOR SELECT USING (
    user_id IN (
      SELECT wm.user_id FROM workspace_members wm
      WHERE wm.workspace_id IN (
        SELECT wm2.workspace_id FROM workspace_members wm2 WHERE wm2.user_id = auth.uid()
      )
    )
  );

-- ─── Workspaces Policies ────────────────────────────────────────────
DROP POLICY IF EXISTS "workspaces_select_members" ON workspaces;
DROP POLICY IF EXISTS "workspaces_insert_auth" ON workspaces;
DROP POLICY IF EXISTS "workspaces_update_admin" ON workspaces;

CREATE POLICY "workspaces_select_members" ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "workspaces_insert_auth" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "workspaces_update_admin" ON workspaces
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ─── Workspace Members Policies ─────────────────────────────────────
DROP POLICY IF EXISTS "workspace_members_select" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_admin" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_owner" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_admin" ON workspace_members;

CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "workspace_members_insert_admin" ON workspace_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "workspace_members_update_owner" ON workspace_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'owner'
    )
  );

CREATE POLICY "workspace_members_delete_admin" ON workspace_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
    AND user_id != auth.uid()
  );

-- ─── Workspace Invitations Policies ─────────────────────────────────
DROP POLICY IF EXISTS "workspace_invitations_select" ON workspace_invitations;
DROP POLICY IF EXISTS "workspace_invitations_insert_admin" ON workspace_invitations;
DROP POLICY IF EXISTS "workspace_invitations_update_admin" ON workspace_invitations;

CREATE POLICY "workspace_invitations_select" ON workspace_invitations
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "workspace_invitations_insert_admin" ON workspace_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_invitations.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "workspace_invitations_update_admin" ON workspace_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_invitations.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- ─── Projects Policies ──────────────────────────────────────────────
DROP POLICY IF EXISTS "projects_select_members" ON projects;
DROP POLICY IF EXISTS "projects_insert_members" ON projects;
DROP POLICY IF EXISTS "projects_update_members" ON projects;

CREATE POLICY "projects_select_members" ON projects
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "projects_insert_members" ON projects
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'developer'))
  );

CREATE POLICY "projects_update_members" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = projects.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

-- ─── Project Members Policies ───────────────────────────────────────
DROP POLICY IF EXISTS "project_members_select" ON project_members;
DROP POLICY IF EXISTS "project_members_insert" ON project_members;
DROP POLICY IF EXISTS "project_members_update" ON project_members;
DROP POLICY IF EXISTS "project_members_delete" ON project_members;

CREATE POLICY "project_members_select" ON project_members
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE p.id = project_members.project_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

CREATE POLICY "project_members_update" ON project_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE p.id = project_members.project_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "project_members_delete" ON project_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE p.id = project_members.project_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- ─── Project Key Envelopes Policies ─────────────────────────────────
DROP POLICY IF EXISTS "project_key_envelopes_select_own" ON project_key_envelopes;
DROP POLICY IF EXISTS "project_key_envelopes_insert_admin" ON project_key_envelopes;
DROP POLICY IF EXISTS "project_key_envelopes_update_admin" ON project_key_envelopes;

CREATE POLICY "project_key_envelopes_select_own" ON project_key_envelopes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "project_key_envelopes_insert_admin" ON project_key_envelopes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_key_envelopes.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "project_key_envelopes_update_admin" ON project_key_envelopes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_key_envelopes.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- ─── Environments Policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "environments_select" ON environments;
DROP POLICY IF EXISTS "environments_insert" ON environments;
DROP POLICY IF EXISTS "environments_update" ON environments;
DROP POLICY IF EXISTS "environments_delete" ON environments;

CREATE POLICY "environments_select" ON environments
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "environments_insert" ON environments
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

CREATE POLICY "environments_update" ON environments
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

CREATE POLICY "environments_delete" ON environments
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

-- ─── Encrypted Secrets Policies ─────────────────────────────────────
DROP POLICY IF EXISTS "encrypted_secrets_select" ON encrypted_secrets;
DROP POLICY IF EXISTS "encrypted_secrets_insert" ON encrypted_secrets;
DROP POLICY IF EXISTS "encrypted_secrets_update" ON encrypted_secrets;
DROP POLICY IF EXISTS "encrypted_secrets_delete" ON encrypted_secrets;

CREATE POLICY "encrypted_secrets_select" ON encrypted_secrets
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "encrypted_secrets_insert" ON encrypted_secrets
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

CREATE POLICY "encrypted_secrets_update" ON encrypted_secrets
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

CREATE POLICY "encrypted_secrets_delete" ON encrypted_secrets
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

-- ─── Branches Policies ──────────────────────────────────────────────
DROP POLICY IF EXISTS "branches_select" ON branches;
DROP POLICY IF EXISTS "branches_insert" ON branches;
DROP POLICY IF EXISTS "branches_update" ON branches;
DROP POLICY IF EXISTS "branches_delete" ON branches;

CREATE POLICY "branches_select" ON branches
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "branches_insert" ON branches
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

CREATE POLICY "branches_update" ON branches
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

CREATE POLICY "branches_delete" ON branches
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

-- ─── Tasks Policies ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

-- ─── Integration Connections Policies ───────────────────────────────
DROP POLICY IF EXISTS "integration_connections_select" ON integration_connections;
DROP POLICY IF EXISTS "integration_connections_insert" ON integration_connections;
DROP POLICY IF EXISTS "integration_connections_update" ON integration_connections;
DROP POLICY IF EXISTS "integration_connections_delete" ON integration_connections;

CREATE POLICY "integration_connections_select" ON integration_connections
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "integration_connections_insert" ON integration_connections
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "integration_connections_update" ON integration_connections
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "integration_connections_delete" ON integration_connections
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

-- ─── Audit Events Policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "audit_events_select" ON audit_events;
DROP POLICY IF EXISTS "audit_events_insert" ON audit_events;

CREATE POLICY "audit_events_select" ON audit_events
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    OR project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "audit_events_insert" ON audit_events
  FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- ═══════════════════════════════════════════════════════════════════
-- PHASE 4: Indexes
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_key_envelopes_user ON project_key_envelopes(user_id);
CREATE INDEX IF NOT EXISTS idx_environments_project ON environments(project_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_secrets_environment ON encrypted_secrets(environment_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_secrets_project ON encrypted_secrets(project_id);
CREATE INDEX IF NOT EXISTS idx_branches_project ON branches(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_audit_events_workspace ON audit_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_project ON audit_events(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_status ON workspace_invitations(status);

-- ═══════════════════════════════════════════════════════════════════
-- PHASE 5: Auto-update timestamps trigger
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (for re-runnability)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_environments_updated_at ON environments;
DROP TRIGGER IF EXISTS update_encrypted_secrets_updated_at ON encrypted_secrets;
DROP TRIGGER IF EXISTS update_branches_updated_at ON branches;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_integration_connections_updated_at ON integration_connections;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_environments_updated_at BEFORE UPDATE ON environments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_encrypted_secrets_updated_at BEFORE UPDATE ON encrypted_secrets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_integration_connections_updated_at BEFORE UPDATE ON integration_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
