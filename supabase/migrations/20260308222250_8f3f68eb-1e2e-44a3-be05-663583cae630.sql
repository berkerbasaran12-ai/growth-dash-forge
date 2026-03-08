
ALTER TABLE public.weekly_reports
  ADD COLUMN dm_count integer NOT NULL DEFAULT 0,
  ADD COLUMN impressions integer NOT NULL DEFAULT 0,
  ADD COLUMN reach integer NOT NULL DEFAULT 0,
  ADD COLUMN clicks integer NOT NULL DEFAULT 0;
