
-- Marketing metrics per channel per day
CREATE TABLE public.marketing_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  channel text NOT NULL DEFAULT 'other',
  spend numeric NOT NULL DEFAULT 0,
  traffic integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  cpc numeric NOT NULL DEFAULT 0,
  cpm numeric NOT NULL DEFAULT 0,
  engagement_rate numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, channel)
);

ALTER TABLE public.marketing_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own marketing" ON public.marketing_metrics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own marketing" ON public.marketing_metrics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own marketing" ON public.marketing_metrics FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own marketing" ON public.marketing_metrics FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all marketing" ON public.marketing_metrics FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Team view client marketing" ON public.marketing_metrics FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM team_members WHERE member_user_id = auth.uid() AND client_user_id = marketing_metrics.user_id));
CREATE POLICY "Team full insert marketing" ON public.marketing_metrics FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE member_user_id = auth.uid() AND client_user_id = marketing_metrics.user_id AND permission = 'full'));
CREATE POLICY "Team full update marketing" ON public.marketing_metrics FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM team_members WHERE member_user_id = auth.uid() AND client_user_id = marketing_metrics.user_id AND permission = 'full'));
CREATE POLICY "Team full delete marketing" ON public.marketing_metrics FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM team_members WHERE member_user_id = auth.uid() AND client_user_id = marketing_metrics.user_id AND permission = 'full'));

-- Add new sales columns
ALTER TABLE public.sales_metrics
  ADD COLUMN IF NOT EXISTS win_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_deal_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS appointments integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS churn_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ltv numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_received integer NOT NULL DEFAULT 0;
