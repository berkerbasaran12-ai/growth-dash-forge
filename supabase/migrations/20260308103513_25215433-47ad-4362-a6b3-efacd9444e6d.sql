
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'client');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  company TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create sales_metrics table
CREATE TABLE public.sales_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_sales NUMERIC(12,2) NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,
  avg_cart_value NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE WHEN order_count > 0 THEN total_sales / order_count ELSE 0 END
  ) STORED,
  new_customers INTEGER NOT NULL DEFAULT 0,
  returning_customers INTEGER NOT NULL DEFAULT 0,
  net_profit NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create kb_categories table
CREATE TABLE public.kb_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📚',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kb_content table
CREATE TABLE public.kb_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES public.kb_categories(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL DEFAULT 'video' CHECK (content_type IN ('video', 'pdf', 'link')),
  content_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('kb-files', 'kb-files', true);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_content ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Sales metrics policies
CREATE POLICY "Users can view own metrics" ON public.sales_metrics
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all metrics" ON public.sales_metrics
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own metrics" ON public.sales_metrics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metrics" ON public.sales_metrics
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own metrics" ON public.sales_metrics
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- KB categories policies (readable by all authenticated, manageable by admin)
CREATE POLICY "All authenticated can view categories" ON public.kb_categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.kb_categories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- KB content policies
CREATE POLICY "Authenticated can view published content" ON public.kb_content
  FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "Admins can view all content" ON public.kb_content
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage content" ON public.kb_content
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for kb-files
CREATE POLICY "Anyone can view kb files" ON storage.objects
  FOR SELECT USING (bucket_id = 'kb-files');
CREATE POLICY "Admins can upload kb files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kb-files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete kb files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'kb-files' AND public.has_role(auth.uid(), 'admin'));

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_metrics_updated_at BEFORE UPDATE ON public.sales_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kb_content_updated_at BEFORE UPDATE ON public.kb_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default KB categories
INSERT INTO public.kb_categories (name, icon, sort_order) VALUES
  ('Dashboard Kullanımı', '📊', 1),
  ('Satış Stratejileri', '💰', 2),
  ('Veri Analizi', '📈', 3),
  ('Pazarlama İpuçları', '🎯', 4),
  ('Sistem Ayarları', '⚙️', 5);
