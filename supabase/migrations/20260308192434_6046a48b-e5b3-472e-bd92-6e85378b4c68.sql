
-- Store OAuth tokens for ad platform integrations
CREATE TABLE public.ad_platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL, -- 'google_ads' or 'meta_ads'
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  account_id text, -- Google Ads customer ID or Meta Ad Account ID
  account_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.ad_platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" ON public.ad_platform_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON public.ad_platform_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON public.ad_platform_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON public.ad_platform_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all connections" ON public.ad_platform_connections FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
