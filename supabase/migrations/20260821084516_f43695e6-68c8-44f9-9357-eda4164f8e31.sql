REVOKE EXECUTE ON FUNCTION public.get_tree_share_token(uuid) FROM anon;
REVOKE ALL (share_token) ON public.family_trees FROM anon, authenticated;
GRANT SELECT (share_token) ON public.family_trees TO service_role;