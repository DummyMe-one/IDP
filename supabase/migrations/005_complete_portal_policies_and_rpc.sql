-- Supabase Migration: 005_complete_portal_policies_and_rpc.sql
-- Consolidated, 100% idempotent repair & enhancement script for Supabase SQL Editor.
-- Safe to run multiple times on any existing or newly initialized IDP database.

-- 1. Automatic profile creation trigger on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data ->> 'full_name'
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Non-recursive workspace role helper (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_workspace_role(
  target_workspace_id UUID,
  allowed_roles TEXT[]
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.workspace_members AS wm
      WHERE wm.workspace_id = target_workspace_id
        AND wm.user_id = (SELECT auth.uid())
        AND wm.role = ANY (allowed_roles)
    )
    OR (
      'owner' = ANY (allowed_roles)
      AND EXISTS (
        SELECT 1
        FROM public.workspaces AS w
        WHERE w.id = target_workspace_id
          AND w.owner_id = (SELECT auth.uid())
      )
    );
$$;

REVOKE ALL ON FUNCTION public.has_workspace_role(UUID, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(UUID, TEXT[]) TO service_role;

-- 3. Clean up any recursive workspace_members policies and recreate cleanly
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspace_members'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.workspace_members',
      policy_record.policyname
    );
  END LOOP;
END;
$$;

CREATE POLICY "workspace_members_select" ON public.workspace_members
  FOR SELECT USING (
    public.has_workspace_role(
      workspace_id,
      ARRAY['owner', 'admin', 'developer', 'viewer']::TEXT[]
    )
  );

CREATE POLICY "workspace_members_insert_admin" ON public.workspace_members
  FOR INSERT WITH CHECK (
    public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::TEXT[])
  );

CREATE POLICY "workspace_members_update_owner" ON public.workspace_members
  FOR UPDATE
  USING (public.has_workspace_role(workspace_id, ARRAY['owner']::TEXT[]))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner']::TEXT[]));

CREATE POLICY "workspace_members_delete_admin" ON public.workspace_members
  FOR DELETE USING (
    public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::TEXT[])
    AND user_id != (SELECT auth.uid())
  );

-- 4. Allow co-members in shared workspaces to view each other's profiles
DROP POLICY IF EXISTS "profiles_select_comembers" ON public.profiles;
CREATE POLICY "profiles_select_comembers" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1
      FROM public.workspace_members wm_target
      WHERE wm_target.user_id = profiles.id
        AND public.has_workspace_role(
          wm_target.workspace_id,
          ARRAY['owner', 'admin', 'developer', 'viewer']::TEXT[]
        )
    )
  );

-- 5. Add missing DELETE policies for projects and workspaces
DROP POLICY IF EXISTS "projects_delete_members" ON public.projects;
CREATE POLICY "projects_delete_members" ON public.projects
  FOR DELETE USING (
    owner_id = (SELECT auth.uid())
    OR public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::TEXT[])
  );

DROP POLICY IF EXISTS "workspaces_delete_owner" ON public.workspaces;
CREATE POLICY "workspaces_delete_owner" ON public.workspaces
  FOR DELETE USING (owner_id = (SELECT auth.uid()));

-- 6. Atomic project creation RPC with 4 default environments + main branch
CREATE OR REPLACE FUNCTION public.create_project_with_defaults(
  p_workspace_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_repository_url TEXT DEFAULT NULL
)
RETURNS public.projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  created_project public.projects;
  project_slug TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to create a project'
      USING ERRCODE = '42501';
  END IF;

  IF NOT public.has_workspace_role(
    p_workspace_id,
    ARRAY['owner', 'admin', 'developer']::TEXT[]
  ) THEN
    RAISE EXCEPTION 'You do not have permission to create projects in this workspace'
      USING ERRCODE = '42501';
  END IF;

  project_slug := trim(both '-' FROM regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  IF project_slug = '' THEN
    RAISE EXCEPTION 'Project name must contain at least one letter or number'
      USING ERRCODE = '22023';
  END IF;

  -- Append short suffix if slug already exists in this workspace
  IF EXISTS (
    SELECT 1 FROM public.projects
    WHERE workspace_id = p_workspace_id AND slug = project_slug
  ) THEN
    project_slug := project_slug || '-' || substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 6);
  END IF;

  INSERT INTO public.projects (
    workspace_id, name, slug, description, repository_url, owner_id
  )
  VALUES (
    p_workspace_id, trim(p_name), project_slug, p_description, p_repository_url, auth.uid()
  )
  RETURNING * INTO created_project;

  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (created_project.id, auth.uid(), 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;

  INSERT INTO public.environments (project_id, name, type)
  VALUES
    (created_project.id, 'Development', 'development'),
    (created_project.id, 'Testing', 'testing'),
    (created_project.id, 'Staging', 'staging'),
    (created_project.id, 'Production', 'production')
  ON CONFLICT (project_id, name) DO NOTHING;

  INSERT INTO public.branches (
    project_id, name, repository_ref, commit_sha, commit_message, commit_date, is_active, is_synced
  )
  VALUES (
    created_project.id,
    'main',
    'refs/heads/main',
    substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 7),
    'Initial project branch provisioned',
    NOW(),
    TRUE,
    TRUE
  )
  ON CONFLICT (project_id, name) DO NOTHING;

  RETURN created_project;
END;
$$;

REVOKE ALL ON FUNCTION public.create_project_with_defaults(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_project_with_defaults(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_project_with_defaults(UUID, TEXT, TEXT, TEXT) TO service_role;
