
CREATE TABLE public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  new_customer_revenue numeric NOT NULL DEFAULT 0,
  existing_customer_revenue numeric NOT NULL DEFAULT 0,
  total_revenue numeric NOT NULL DEFAULT 0,
  ad_spend numeric NOT NULL DEFAULT 0,
  operational_spend numeric NOT NULL DEFAULT 0,
  outsource_spend numeric NOT NULL DEFAULT 0,
  salary_spend numeric NOT NULL DEFAULT 0,
  dividend_spend numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  net_profit numeric NOT NULL DEFAULT 0,
  leads_count integer NOT NULL DEFAULT 0,
  meetings_planned integer NOT NULL DEFAULT 0,
  meetings_held integer NOT NULL DEFAULT 0,
  sales_closed integer NOT NULL DEFAULT 0,
  weekly_notes text DEFAULT '',
  challenges text DEFAULT '',
  next_week_plan text DEFAULT '',
  include_payments boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.weekly_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.weekly_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON public.weekly_reports
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON public.weekly_reports
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reports" ON public.weekly_reports
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
