
CREATE TABLE public.monthly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  target_revenue NUMERIC NOT NULL DEFAULT 0,
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all monthly goals" ON public.monthly_goals FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own monthly goals" ON public.monthly_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly goals" ON public.monthly_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly goals" ON public.monthly_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
