
CREATE TABLE public.sales_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month date NOT NULL,
  target_sales numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.sales_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.sales_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.sales_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.sales_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all goals" ON public.sales_goals FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Team members can view client goals" ON public.sales_goals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM team_members WHERE team_members.member_user_id = auth.uid() AND team_members.client_user_id = sales_goals.user_id));
CREATE POLICY "Team full access insert goals" ON public.sales_goals FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE team_members.member_user_id = auth.uid() AND team_members.client_user_id = sales_goals.user_id AND team_members.permission = 'full'));
CREATE POLICY "Team full access update goals" ON public.sales_goals FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM team_members WHERE team_members.member_user_id = auth.uid() AND team_members.client_user_id = sales_goals.user_id AND team_members.permission = 'full'));
