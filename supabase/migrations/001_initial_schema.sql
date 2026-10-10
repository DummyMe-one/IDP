-- Supabase Migration: 001_initial_schema.sql
-- Internal Developer Portal - Database Schema
-- Enable RLS on all tables

-- ─── Extensions ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

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

ALTER TABLE user_vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vault" ON user_vaults
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault" ON user_vaults
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault" ON user_vaults
  FOR UPDATE USING (auth.uid() = user_id);

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

ALTER TABLE user_crypto_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own crypto keys" ON user_crypto_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crypto keys" ON user_crypto_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crypto keys" ON user_crypto_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow workspace/project members to read public keys of other members
CREATE POLICY "Members can view public keys of co-members" ON user_crypto_keys
  FOR SELECT USING (
    user_id IN (
      SELECT wm.user_id FROM workspace_members wm
      WHERE wm.workspace_id IN (
        SELECT wm2.workspace_id FROM workspace_members wm2 WHERE wm2.user_id = auth.uid()
      )
    )
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

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspaces" ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and admins can update workspaces" ON workspaces
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    )
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

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners and admins can manage members" ON workspace_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners can update member roles" ON workspace_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'owner'
    )
  );

CREATE POLICY "Owners and admins can remove members" ON workspace_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
    AND user_id != auth.uid()
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

ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invitations" ON workspace_invitations
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners and admins can create invitations" ON workspace_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_invitations.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update invitations" ON workspace_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_invitations.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
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

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view projects" ON projects
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Workspace members can create projects" ON projects
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'developer'))
  );

CREATE POLICY "Project members can update projects" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = projects.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'developer')
    )
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

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view members" ON project_members
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
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

ALTER TABLE project_key_envelopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project key envelopes" ON project_key_envelopes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Project owners can create envelopes" ON project_key_envelopes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_key_envelopes.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Project owners can update envelopes" ON project_key_envelopes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_key_envelopes.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
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

ALTER TABLE environments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view environments" ON environments
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project developers can manage environments" ON environments
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

CREATE POLICY "Project developers can update environments" ON environments
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
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

ALTER TABLE encrypted_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view secrets" ON encrypted_secrets
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project developers can manage secrets" ON encrypted_secrets
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

CREATE POLICY "Project developers can update secrets" ON encrypted_secrets
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
  );

CREATE POLICY "Project developers can delete secrets" ON encrypted_secrets
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
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

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view branches" ON branches
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project developers can manage branches" ON branches
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
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

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view tasks" ON tasks
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project developers can manage tasks" ON tasks
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'developer')
    )
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

ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view integrations" ON integration_connections
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can manage integrations" ON integration_connections
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
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

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace audit events" ON audit_events
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    OR project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit events" ON audit_events
  FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- ─── Indexes ────────────────────────────────────────────────────────
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

-- ─── Auto-update timestamps ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_environments_updated_at BEFORE UPDATE ON environments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_encrypted_secrets_updated_at BEFORE UPDATE ON encrypted_secrets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_integration_connections_updated_at BEFORE UPDATE ON integration_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
