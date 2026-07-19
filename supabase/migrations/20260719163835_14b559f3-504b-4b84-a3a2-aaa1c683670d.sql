DROP POLICY "Anyone can view active banners" ON public.site_banners;
CREATE POLICY "Public can view active banners" ON public.site_banners FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Super admins can view all banners" ON public.site_banners FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'));