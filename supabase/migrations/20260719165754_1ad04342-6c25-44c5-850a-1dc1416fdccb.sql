
-- 1) Force privacy masking on family_members: remove direct SELECT policies that
--    exposed hide_dob/hide_contact fields to public/anon and non-collaborators.
--    Public/link viewers must now go through get_shared_tree_members() which
--    already masks date_of_birth and current_place per the hide flags.
DROP POLICY IF EXISTS "Anon view members of public trees" ON public.family_members;
DROP POLICY IF EXISTS "View members of accessible trees" ON public.family_members;

CREATE POLICY "Owners collaborators super admins view members"
  ON public.family_members
  FOR SELECT
  TO authenticated
  USING (
    public.is_tree_owner(tree_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tree_collaborators c
      WHERE c.tree_id = family_members.tree_id AND c.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- 2) Lock down SECURITY DEFINER functions exposed on the API schema.
--    Revoke default PUBLIC EXECUTE and re-grant only where needed.

-- Trigger-only / internal helpers: no direct API callers.
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_share_token() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_entitlement(uuid, uuid, entitlement_kind) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_tree_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- RLS helper functions: needed by authenticated policies at runtime, but must
-- not be callable by anon over the API.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.can_view_tree(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.can_view_tree(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.can_edit_tree(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.can_edit_tree(uuid, uuid) TO authenticated;

-- Intentionally public RPCs used by the share/invite flows.
REVOKE EXECUTE ON FUNCTION public.get_shared_tree(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_shared_tree(uuid, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_shared_tree_members(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_shared_tree_members(uuid, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.peek_invitation(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.peek_invitation(text) TO anon, authenticated;

-- Accepting requires a signed-in user; do not expose to anon.
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
