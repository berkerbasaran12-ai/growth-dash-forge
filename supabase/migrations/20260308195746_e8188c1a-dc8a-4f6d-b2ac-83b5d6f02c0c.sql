
-- Content visibility: which users can see which content
-- If no rows exist for a content_id, content is visible to all (public)
-- If rows exist, only those users can see the content
CREATE TABLE public.kb_content_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.kb_content(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(content_id, user_id)
);

ALTER TABLE public.kb_content_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage content visibility" ON public.kb_content_visibility
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add visibility_type column to kb_content: 'public' or 'restricted'
ALTER TABLE public.kb_content ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
