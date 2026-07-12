
-- Enums
CREATE TYPE public.gender_type AS ENUM ('male','female','other');
CREATE TYPE public.marriage_status AS ENUM ('married','divorced','widowed','separated');
CREATE TYPE public.parent_child_type AS ENUM ('biological','adopted','step');

-- family_trees
CREATE TABLE public.family_trees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  surname text,
  gotra text,
  kul text,
  ancestral_village text,
  language text NOT NULL DEFAULT 'hi',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_trees TO authenticated;
GRANT ALL ON public.family_trees TO service_role;
ALTER TABLE public.family_trees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their trees" ON public.family_trees
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Super admins view all trees" ON public.family_trees
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER trg_family_trees_updated_at
  BEFORE UPDATE ON public.family_trees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_family_trees_owner ON public.family_trees(owner_id);

-- family_members
CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  display_name text,
  gender public.gender_type,
  is_alive boolean NOT NULL DEFAULT true,
  is_root boolean NOT NULL DEFAULT false,
  generation integer,
  date_of_birth date,
  date_of_death date,
  birth_place text,
  current_place text,
  occupation text,
  notes text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tree owners manage members" ON public.family_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.family_trees t WHERE t.id = tree_id AND t.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.family_trees t WHERE t.id = tree_id AND t.owner_id = auth.uid()));
CREATE POLICY "Super admins view all members" ON public.family_members
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER trg_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_family_members_tree ON public.family_members(tree_id);

-- parent_child_relationships
CREATE TABLE public.parent_child_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  relationship_type public.parent_child_type NOT NULL DEFAULT 'biological',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id),
  CHECK (parent_id <> child_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_child_relationships TO authenticated;
GRANT ALL ON public.parent_child_relationships TO service_role;
ALTER TABLE public.parent_child_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tree owners manage parent-child" ON public.parent_child_relationships
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.family_trees t WHERE t.id = tree_id AND t.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.family_trees t WHERE t.id = tree_id AND t.owner_id = auth.uid()));
CREATE POLICY "Super admins view all parent-child" ON public.parent_child_relationships
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_pcr_tree ON public.parent_child_relationships(tree_id);
CREATE INDEX idx_pcr_parent ON public.parent_child_relationships(parent_id);
CREATE INDEX idx_pcr_child ON public.parent_child_relationships(child_id);

-- marriages
CREATE TABLE public.marriages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  spouse_a_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  spouse_b_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  marriage_date date,
  marriage_place text,
  status public.marriage_status NOT NULL DEFAULT 'married',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (spouse_a_id <> spouse_b_id)
);
CREATE UNIQUE INDEX marriages_unique_pair
  ON public.marriages (LEAST(spouse_a_id, spouse_b_id), GREATEST(spouse_a_id, spouse_b_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marriages TO authenticated;
GRANT ALL ON public.marriages TO service_role;
ALTER TABLE public.marriages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tree owners manage marriages" ON public.marriages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.family_trees t WHERE t.id = tree_id AND t.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.family_trees t WHERE t.id = tree_id AND t.owner_id = auth.uid()));
CREATE POLICY "Super admins view all marriages" ON public.marriages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER trg_marriages_updated_at
  BEFORE UPDATE ON public.marriages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_marriages_tree ON public.marriages(tree_id);
