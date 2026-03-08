
-- Category-level access: which users can access which categories
CREATE TABLE public.kb_category_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.kb_categories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, user_id)
);

ALTER TABLE public.kb_category_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage category access" ON public.kb_category_access
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own category access" ON public.kb_category_access
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Remove content-level visibility (no longer needed)
ALTER TABLE public.kb_content DROP COLUMN IF EXISTS visibility;
DROP TABLE IF EXISTS public.kb_content_visibility;
