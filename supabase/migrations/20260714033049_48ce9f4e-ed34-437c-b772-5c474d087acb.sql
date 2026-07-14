
-- 1. visibility enum + column
DO $$ BEGIN
  CREATE TYPE public.tree_visibility AS ENUM ('private','link','public');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.family_trees
  ADD COLUMN IF NOT EXISTS visibility public.tree_visibility NOT NULL DEFAULT 'private';

-- 2. member privacy flags
ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS hide_dob boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_contact boolean NOT NULL DEFAULT false;

-- 3. collaborators
DO $$ BEGIN
  CREATE TYPE public.collab_role AS ENUM ('viewer','editor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.tree_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.collab_role NOT NULL DEFAULT 'viewer',
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tree_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tree_collaborators TO authenticated;
GRANT ALL ON public.tree_collaborators TO service_role;
ALTER TABLE public.tree_collaborators ENABLE ROW LEVEL SECURITY;

-- 4. invitations
CREATE TABLE IF NOT EXISTS public.tree_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.collab_role NOT NULL DEFAULT 'viewer',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by uuid NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tree_invitations TO authenticated;
GRANT SELECT, UPDATE ON public.tree_invitations TO anon;
GRANT ALL ON public.tree_invitations TO service_role;
ALTER TABLE public.tree_invitations ENABLE ROW LEVEL SECURITY;

-- 5. helper security definer functions (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_tree_owner(_tree_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.family_trees WHERE id = _tree_id AND owner_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.can_edit_tree(_tree_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    _user_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM public.family_trees WHERE id = _tree_id AND owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.tree_collaborators WHERE tree_id = _tree_id AND user_id = _user_id AND role = 'editor')
      OR public.has_role(_user_id, 'super_admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.can_view_tree(_tree_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_trees t
    WHERE t.id = _tree_id
      AND (
        t.visibility IN ('link','public')
        OR (_user_id IS NOT NULL AND (
          t.owner_id = _user_id
          OR EXISTS (SELECT 1 FROM public.tree_collaborators c WHERE c.tree_id = t.id AND c.user_id = _user_id)
          OR public.has_role(_user_id, 'super_admin')
        ))
      )
  );
$$;

-- 6. Update RLS policies on family_trees
DROP POLICY IF EXISTS "Owners manage their trees" ON public.family_trees;
DROP POLICY IF EXISTS "Super admins view all trees" ON public.family_trees;
DROP POLICY IF EXISTS "View trees I can access" ON public.family_trees;
DROP POLICY IF EXISTS "Owners insert own trees" ON public.family_trees;
DROP POLICY IF EXISTS "Owners update own trees" ON public.family_trees;
DROP POLICY IF EXISTS "Owners delete own trees" ON public.family_trees;

CREATE POLICY "View trees I can access" ON public.family_trees
  FOR SELECT TO authenticated
  USING (public.can_view_tree(id, auth.uid()));
CREATE POLICY "Public/link trees viewable by anon" ON public.family_trees
  FOR SELECT TO anon
  USING (visibility IN ('link','public'));
CREATE POLICY "Owners insert own trees" ON public.family_trees
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own trees" ON public.family_trees
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete own trees" ON public.family_trees
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 7. family_members policies
DROP POLICY IF EXISTS "Super admins view all members" ON public.family_members;
DROP POLICY IF EXISTS "Tree owners manage members" ON public.family_members;
DROP POLICY IF EXISTS "View members of accessible trees" ON public.family_members;
DROP POLICY IF EXISTS "Editors manage members" ON public.family_members;
DROP POLICY IF EXISTS "Anon view members of public trees" ON public.family_members;

CREATE POLICY "View members of accessible trees" ON public.family_members
  FOR SELECT TO authenticated USING (public.can_view_tree(tree_id, auth.uid()));
CREATE POLICY "Anon view members of public trees" ON public.family_members
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.family_trees t WHERE t.id = tree_id AND t.visibility IN ('link','public')));
CREATE POLICY "Editors manage members" ON public.family_members
  FOR ALL TO authenticated
  USING (public.can_edit_tree(tree_id, auth.uid()))
  WITH CHECK (public.can_edit_tree(tree_id, auth.uid()));

-- 8. marriages
DROP POLICY IF EXISTS "Super admins view all marriages" ON public.marriages;
DROP POLICY IF EXISTS "Tree owners manage marriages" ON public.marriages;
DROP POLICY IF EXISTS "View marriages of accessible trees" ON public.marriages;
DROP POLICY IF EXISTS "Editors manage marriages" ON public.marriages;
DROP POLICY IF EXISTS "Anon view marriages of public trees" ON public.marriages;

CREATE POLICY "View marriages of accessible trees" ON public.marriages
  FOR SELECT TO authenticated USING (public.can_view_tree(tree_id, auth.uid()));
CREATE POLICY "Anon view marriages of public trees" ON public.marriages
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.family_trees t WHERE t.id = tree_id AND t.visibility IN ('link','public')));
CREATE POLICY "Editors manage marriages" ON public.marriages
  FOR ALL TO authenticated
  USING (public.can_edit_tree(tree_id, auth.uid()))
  WITH CHECK (public.can_edit_tree(tree_id, auth.uid()));

-- 9. parent_child_relationships
DROP POLICY IF EXISTS "Super admins view all parent-child" ON public.parent_child_relationships;
DROP POLICY IF EXISTS "Tree owners manage parent-child" ON public.parent_child_relationships;
DROP POLICY IF EXISTS "View pc of accessible trees" ON public.parent_child_relationships;
DROP POLICY IF EXISTS "Editors manage pc" ON public.parent_child_relationships;
DROP POLICY IF EXISTS "Anon view pc of public trees" ON public.parent_child_relationships;

CREATE POLICY "View pc of accessible trees" ON public.parent_child_relationships
  FOR SELECT TO authenticated USING (public.can_view_tree(tree_id, auth.uid()));
CREATE POLICY "Anon view pc of public trees" ON public.parent_child_relationships
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.family_trees t WHERE t.id = tree_id AND t.visibility IN ('link','public')));
CREATE POLICY "Editors manage pc" ON public.parent_child_relationships
  FOR ALL TO authenticated
  USING (public.can_edit_tree(tree_id, auth.uid()))
  WITH CHECK (public.can_edit_tree(tree_id, auth.uid()));

-- 10. tree_collaborators policies
CREATE POLICY "Owners manage collaborators" ON public.tree_collaborators
  FOR ALL TO authenticated
  USING (public.is_tree_owner(tree_id, auth.uid()))
  WITH CHECK (public.is_tree_owner(tree_id, auth.uid()));
CREATE POLICY "See my own collaborator rows" ON public.tree_collaborators
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 11. tree_invitations policies
CREATE POLICY "Owners manage invitations" ON public.tree_invitations
  FOR ALL TO authenticated
  USING (public.is_tree_owner(tree_id, auth.uid()))
  WITH CHECK (public.is_tree_owner(tree_id, auth.uid()));
-- Anyone with the token can look up an invite by token (their app filters by token)
CREATE POLICY "Anyone can read invitations to accept" ON public.tree_invitations
  FOR SELECT TO anon, authenticated
  USING (accepted_at IS NULL AND expires_at > now());
