
-- Create team_invites table
CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL,
  email text NOT NULL,
  permission text NOT NULL DEFAULT 'view',
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(token)
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage invites" ON public.team_invites FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL,
  member_user_id uuid NOT NULL,
  permission text NOT NULL DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_user_id, member_user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members can view own membership" ON public.team_members FOR SELECT TO authenticated USING (auth.uid() = member_user_id);
CREATE POLICY "Client owners can view their team" ON public.team_members FOR SELECT TO authenticated USING (auth.uid() = client_user_id);

-- Team members can view client's sales metrics
CREATE POLICY "Team members can view client metrics" ON public.sales_metrics FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE member_user_id = auth.uid() AND client_user_id = sales_metrics.user_id)
);

-- Team members with full access can insert/update/delete client metrics
CREATE POLICY "Team members full access insert" ON public.sales_metrics FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.team_members WHERE member_user_id = auth.uid() AND client_user_id = sales_metrics.user_id AND permission = 'full')
);
CREATE POLICY "Team members full access update" ON public.sales_metrics FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE member_user_id = auth.uid() AND client_user_id = sales_metrics.user_id AND permission = 'full')
);
CREATE POLICY "Team members full access delete" ON public.sales_metrics FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE member_user_id = auth.uid() AND client_user_id = sales_metrics.user_id AND permission = 'full')
);
