-- Evaluate membership checks outside the workspace_members RLS policies to
-- avoid recursively applying those same policies.
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

DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_admin" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_owner" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_admin" ON public.workspace_members;

CREATE POLICY "workspace_members_select" ON public.workspace_members
  FOR SELECT USING (
    public.has_workspace_role(
      workspace_id,
      ARRAY['owner', 'admin', 'developer', 'viewer']::TEXT[]
    )
  );

CREATE POLICY "workspace_members_insert_admin" ON public.workspace_members
  FOR INSERT WITH CHECK (
    public.has_workspace_role(
      workspace_id,
      ARRAY['owner', 'admin']::TEXT[]
    )
  );

CREATE POLICY "workspace_members_update_owner" ON public.workspace_members
  FOR UPDATE USING (
    public.has_workspace_role(
      workspace_id,
      ARRAY['owner']::TEXT[]
    )
  );

CREATE POLICY "workspace_members_delete_admin" ON public.workspace_members
  FOR DELETE USING (
    public.has_workspace_role(
      workspace_id,
      ARRAY['owner', 'admin']::TEXT[]
    )
    AND user_id != (SELECT auth.uid())
  );
