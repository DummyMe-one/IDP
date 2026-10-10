-- Remove every existing workspace_members policy so stale policies with
-- different names cannot continue to trigger recursive RLS evaluation.
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

  INSERT INTO public.projects (
    workspace_id, name, slug, description, repository_url, owner_id
  )
  VALUES (
    p_workspace_id, trim(p_name), project_slug, p_description, p_repository_url, auth.uid()
  )
  RETURNING * INTO created_project;

  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (created_project.id, auth.uid(), 'owner');

  INSERT INTO public.environments (project_id, name, type)
  VALUES
    (created_project.id, 'Development', 'development'),
    (created_project.id, 'Testing', 'testing'),
    (created_project.id, 'Staging', 'staging'),
    (created_project.id, 'Production', 'production');

  RETURN created_project;
END;
$$;

REVOKE ALL ON FUNCTION public.create_project_with_defaults(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_project_with_defaults(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_project_with_defaults(UUID, TEXT, TEXT, TEXT) TO service_role;
