
-- Fix RLS policies: Drop restrictive policies and recreate as permissive
-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Sales metrics
DROP POLICY IF EXISTS "Users can view own metrics" ON public.sales_metrics;
DROP POLICY IF EXISTS "Admins can view all metrics" ON public.sales_metrics;
DROP POLICY IF EXISTS "Users can insert own metrics" ON public.sales_metrics;
DROP POLICY IF EXISTS "Users can update own metrics" ON public.sales_metrics;
DROP POLICY IF EXISTS "Users can delete own metrics" ON public.sales_metrics;

CREATE POLICY "Users can view own metrics" ON public.sales_metrics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all metrics" ON public.sales_metrics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own metrics" ON public.sales_metrics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metrics" ON public.sales_metrics FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own metrics" ON public.sales_metrics FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- KB categories
DROP POLICY IF EXISTS "All authenticated can view categories" ON public.kb_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.kb_categories;

CREATE POLICY "All authenticated can view categories" ON public.kb_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.kb_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- KB content
DROP POLICY IF EXISTS "Authenticated can view published content" ON public.kb_content;
DROP POLICY IF EXISTS "Admins can view all content" ON public.kb_content;
DROP POLICY IF EXISTS "Admins can manage content" ON public.kb_content;

CREATE POLICY "Authenticated can view published content" ON public.kb_content FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "Admins can view all content" ON public.kb_content FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage content" ON public.kb_content FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
