-- Phase 5: Payments, entitlements, coupons, export orders

-- ============ ENUMS ============
CREATE TYPE public.payment_status AS ENUM ('created','attempted','paid','failed','refunded');
CREATE TYPE public.entitlement_kind AS ENUM ('full_pdf','poster_pdf','high_res_bundle');
CREATE TYPE public.coupon_kind AS ENUM ('percent','flat');
CREATE TYPE public.export_kind AS ENUM ('preview_pdf','full_pdf','poster_pdf');

-- ============ PRICING PLANS ============
CREATE TABLE public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  entitlement entitlement_kind NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_plans TO anon, authenticated;
GRANT ALL ON public.pricing_plans TO service_role;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing_plans public read active" ON public.pricing_plans
  FOR SELECT USING (is_active = true);
CREATE POLICY "pricing_plans admin all" ON public.pricing_plans
  FOR ALL USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_pricing_plans_updated_at BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.pricing_plans (code,name,description,entitlement,amount_paise,sort_order) VALUES
  ('full_pdf','Full Family Tree PDF','High-quality Vanshavali PDF without watermark, ready to print at home.','full_pdf',9900,1),
  ('poster_pdf','Heritage Wall Poster','Large-format A2 poster PDF with decorative border, ideal for framing.','poster_pdf',29900,2),
  ('high_res_bundle','Complete Heritage Bundle','Full PDF + Poster + high-resolution image exports.','high_res_bundle',49900,3);

-- ============ COUPONS ============
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  kind coupon_kind NOT NULL,
  value INTEGER NOT NULL CHECK (value > 0),
  max_redemptions INTEGER,
  times_redeemed INTEGER NOT NULL DEFAULT 0,
  applies_to entitlement_kind,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
-- Only super_admin can manage; validation happens server-side in a SECURITY DEFINER RPC.
CREATE POLICY "coupons admin all" ON public.coupons
  FOR ALL USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupon_redemptions own read" ON public.coupon_redemptions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tree_id UUID REFERENCES public.family_trees(id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES public.pricing_plans(id),
  entitlement entitlement_kind NOT NULL,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  discount_paise INTEGER NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'created',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  error_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments own read" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));
-- Inserts/updates go through SECURITY DEFINER server functions only.
CREATE INDEX idx_payments_user ON public.payments(user_id, created_at DESC);
CREATE INDEX idx_payments_tree ON public.payments(tree_id) WHERE tree_id IS NOT NULL;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill FK on coupon_redemptions now that payments exists
ALTER TABLE public.coupon_redemptions
  ADD CONSTRAINT coupon_redemptions_payment_fk
  FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;

-- ============ ENTITLEMENTS ============
CREATE TABLE public.payment_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tree_id UUID NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  entitlement entitlement_kind NOT NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tree_id, entitlement)
);
GRANT SELECT ON public.payment_entitlements TO authenticated;
GRANT ALL ON public.payment_entitlements TO service_role;
ALTER TABLE public.payment_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entitlements own read" ON public.payment_entitlements
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));

-- Helper: has_entitlement (SECURITY DEFINER so server fns can check safely)
CREATE OR REPLACE FUNCTION public.has_entitlement(_user_id UUID, _tree_id UUID, _kind entitlement_kind)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.payment_entitlements
    WHERE user_id = _user_id AND tree_id = _tree_id
      AND (entitlement = _kind OR entitlement = 'high_res_bundle')
  );
$$;
REVOKE ALL ON FUNCTION public.has_entitlement(UUID,UUID,entitlement_kind) FROM public;
GRANT EXECUTE ON FUNCTION public.has_entitlement(UUID,UUID,entitlement_kind) TO authenticated;

-- ============ EXPORT ORDERS (audit trail) ============
CREATE TABLE public.export_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tree_id UUID NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  kind export_kind NOT NULL,
  entitlement_used entitlement_kind,
  member_count INTEGER,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.export_orders TO authenticated;
GRANT ALL ON public.export_orders TO service_role;
ALTER TABLE public.export_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "export_orders own read" ON public.export_orders
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));