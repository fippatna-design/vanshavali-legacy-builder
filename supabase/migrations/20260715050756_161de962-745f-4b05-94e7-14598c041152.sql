
-- ============================================================
-- Phase 4 Security Hardening (corrective)
-- ============================================================

-- 1) SHARE TOKEN on family_trees ---------------------------------
ALTER TABLE public.family_trees
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE;

-- Backfill tokens for existing link/public trees so old link users are not stranded
UPDATE public.family_trees
   SET share_token = encode(gen_random_bytes(24), 'hex')
 WHERE share_token IS NULL;

CREATE OR REPLACE FUNCTION public.ensure_share_token()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.share_token IS NULL THEN
    NEW.share_token := encode(gen_random_bytes(24), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_family_trees_share_token ON public.family_trees;
CREATE TRIGGER trg_family_trees_share_token
  BEFORE INSERT ON public.family_trees
  FOR EACH ROW EXECUTE FUNCTION public.ensure_share_token();

-- 2) Redefine can_view_tree: 'link' is no longer anon-viewable via RLS
CREATE OR REPLACE FUNCTION public.can_view_tree(_tree_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_trees t
    WHERE t.id = _tree_id
      AND (
        t.visibility = 'public'
        OR (_user_id IS NOT NULL AND (
          t.owner_id = _user_id
          OR EXISTS (SELECT 1 FROM public.tree_collaborators c WHERE c.tree_id = t.id AND c.user_id = _user_id)
          OR public.has_role(_user_id, 'super_admin')
        ))
      )
  );
$$;

-- 3) Tighten anon RLS to public-only on all shared tables --------
DROP POLICY IF EXISTS "Public/link trees viewable by anon" ON public.family_trees;
CREATE POLICY "Public trees viewable by anon" ON public.family_trees
  FOR SELECT TO anon USING (visibility = 'public');

DROP POLICY IF EXISTS "Anon view members of public trees" ON public.family_members;
CREATE POLICY "Anon view members of public trees" ON public.family_members
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.family_trees t
                  WHERE t.id = tree_id AND t.visibility = 'public'));

DROP POLICY IF EXISTS "Anon view marriages of public trees" ON public.marriages;
CREATE POLICY "Anon view marriages of public trees" ON public.marriages
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.family_trees t
                  WHERE t.id = tree_id AND t.visibility = 'public'));

DROP POLICY IF EXISTS "Anon view pc of public trees" ON public.parent_child_relationships;
CREATE POLICY "Anon view pc of public trees" ON public.parent_child_relationships
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.family_trees t
                  WHERE t.id = tree_id AND t.visibility = 'public'));

-- 4) INVITATIONS: remove broad exposure --------------------------
DROP POLICY IF EXISTS "Anyone can read invitations to accept" ON public.tree_invitations;
REVOKE SELECT, UPDATE ON public.tree_invitations FROM anon;

-- 5) RPC: fetch shared tree (public OR link+token OR authorized user)
CREATE OR REPLACE FUNCTION public.get_shared_tree(_tree_id uuid, _token text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  surname text,
  gotra text,
  kul text,
  ancestral_village text,
  description text,
  visibility public.tree_visibility
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.name, t.surname, t.gotra, t.kul,
         t.ancestral_village, t.description, t.visibility
    FROM public.family_trees t
   WHERE t.id = _tree_id
     AND (
       t.visibility = 'public'
       OR (t.visibility = 'link' AND _token IS NOT NULL AND t.share_token = _token)
       OR (auth.uid() IS NOT NULL AND (
         t.owner_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.tree_collaborators c
                     WHERE c.tree_id = t.id AND c.user_id = auth.uid())
         OR public.has_role(auth.uid(), 'super_admin')
       ))
     );
$$;

-- 6) RPC: members of a shared tree, with field-level privacy
CREATE OR REPLACE FUNCTION public.get_shared_tree_members(_tree_id uuid, _token text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  gender text,
  is_alive boolean,
  is_root boolean,
  generation int,
  birth_place text,
  current_place text,
  occupation text,
  date_of_birth date,
  hide_dob boolean,
  hide_contact boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id,
         m.full_name,
         m.gender,
         m.is_alive,
         m.is_root,
         m.generation,
         m.birth_place,
         CASE WHEN m.hide_contact THEN NULL ELSE m.current_place END AS current_place,
         m.occupation,
         CASE WHEN m.hide_dob     THEN NULL ELSE m.date_of_birth END AS date_of_birth,
         m.hide_dob,
         m.hide_contact
    FROM public.family_members m
    JOIN public.family_trees t ON t.id = m.tree_id
   WHERE m.tree_id = _tree_id
     AND (
       t.visibility = 'public'
       OR (t.visibility = 'link' AND _token IS NOT NULL AND t.share_token = _token)
       OR (auth.uid() IS NOT NULL AND (
         t.owner_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.tree_collaborators c
                     WHERE c.tree_id = t.id AND c.user_id = auth.uid())
         OR public.has_role(auth.uid(), 'super_admin')
       ))
     )
   ORDER BY m.generation NULLS FIRST;
$$;

REVOKE EXECUTE ON FUNCTION public.get_shared_tree(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_shared_tree_members(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_tree(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_tree_members(uuid, text) TO anon, authenticated;

-- 7) RPC: peek + accept invitations (token-scoped, atomic)
CREATE OR REPLACE FUNCTION public.peek_invitation(_token text)
RETURNS TABLE (tree_id uuid, role public.collab_role, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT tree_id, role, expires_at
    FROM public.tree_invitations
   WHERE token = _token
     AND accepted_at IS NULL
     AND expires_at > now();
$$;

CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS TABLE (tree_id uuid, role public.collab_role)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inv public.tree_invitations%ROWTYPE;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Must be signed in to accept invitation' USING ERRCODE = '28000';
  END IF;

  -- Atomic claim: only one caller can flip accepted_at
  UPDATE public.tree_invitations
     SET accepted_at = now(),
         accepted_by = uid
   WHERE token = _token
     AND accepted_at IS NULL
     AND expires_at > now()
  RETURNING * INTO inv;

  IF inv.id IS NULL THEN
    RAISE EXCEPTION 'Invitation invalid, expired, or already used' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.tree_collaborators (tree_id, user_id, role, invited_by)
  VALUES (inv.tree_id, uid, inv.role, inv.invited_by)
  ON CONFLICT (tree_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN QUERY SELECT inv.tree_id, inv.role;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.peek_invitation(text)   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.peek_invitation(text)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;

-- 8) Tighten helper function privileges
REVOKE EXECUTE ON FUNCTION public.is_tree_owner(uuid, uuid)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_edit_tree(uuid, uuid)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_view_tree(uuid, uuid)  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_tree_owner(uuid, uuid)  TO authenticated;
GRANT  EXECUTE ON FUNCTION public.can_edit_tree(uuid, uuid)  TO authenticated;
GRANT  EXECUTE ON FUNCTION public.can_view_tree(uuid, uuid)  TO authenticated;
