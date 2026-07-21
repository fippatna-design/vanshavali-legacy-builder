-- Prevent anon from reading share_token on family_trees (public policy still lets them read other columns)
REVOKE SELECT (share_token) ON public.family_trees FROM anon;
-- Also restrict authenticated to avoid non-owners reading it via the same policy; owners/collaborators use RPCs/dedicated fetches
REVOKE SELECT (share_token) ON public.family_trees FROM authenticated;
-- Re-grant share_token select to service_role for admin ops
GRANT SELECT (share_token) ON public.family_trees TO service_role;