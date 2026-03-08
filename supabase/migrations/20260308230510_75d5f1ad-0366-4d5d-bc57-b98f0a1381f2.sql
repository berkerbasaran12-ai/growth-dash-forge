
-- Onboarding Templates
CREATE TABLE public.onboarding_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates" ON public.onboarding_templates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view templates" ON public.onboarding_templates
  FOR SELECT TO authenticated USING (true);

-- Onboarding Template Items
CREATE TABLE public.onboarding_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  item_type text NOT NULL DEFAULT 'text',
  is_required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage template items" ON public.onboarding_template_items
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view template items" ON public.onboarding_template_items
  FOR SELECT TO authenticated USING (true);

-- Onboarding Checklists (assigned to clients)
CREATE TABLE public.onboarding_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL,
  template_id uuid REFERENCES public.onboarding_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage checklists" ON public.onboarding_checklists
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view own checklists" ON public.onboarding_checklists
  FOR SELECT TO authenticated USING (auth.uid() = client_user_id);

CREATE POLICY "Clients can update own checklists" ON public.onboarding_checklists
  FOR UPDATE TO authenticated USING (auth.uid() = client_user_id);

-- Onboarding Checklist Items
CREATE TABLE public.onboarding_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.onboarding_checklists(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  item_type text NOT NULL DEFAULT 'text',
  is_required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  response_text text DEFAULT '',
  response_file_url text DEFAULT '',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage checklist items" ON public.onboarding_checklist_items
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view own checklist items" ON public.onboarding_checklist_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.onboarding_checklists c WHERE c.id = checklist_id AND c.client_user_id = auth.uid())
  );

CREATE POLICY "Clients can update own checklist items" ON public.onboarding_checklist_items
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.onboarding_checklists c WHERE c.id = checklist_id AND c.client_user_id = auth.uid())
  );
