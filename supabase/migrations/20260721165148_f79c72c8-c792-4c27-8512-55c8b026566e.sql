CREATE OR REPLACE FUNCTION public.get_tree_share_token(_tree_id uuid)
RETURNS TABLE(share_token text, visibility tree_visibility)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.share_token, t.visibility
    FROM public.family_trees t
   WHERE t.id = _tree_id
     AND auth.uid() IS NOT NULL
     AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));
$$;

REVOKE EXECUTE ON FUNCTION public.get_tree_share_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tree_share_token(uuid) TO authenticated;