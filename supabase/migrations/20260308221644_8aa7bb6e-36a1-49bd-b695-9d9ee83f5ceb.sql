
ALTER TABLE public.weekly_reports 
  ADD COLUMN report_type text NOT NULL DEFAULT 'agency',
  ADD COLUMN target_user_id uuid;
