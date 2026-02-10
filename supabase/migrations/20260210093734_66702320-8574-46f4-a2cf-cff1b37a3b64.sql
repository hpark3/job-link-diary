
-- Add job signal columns to snapshots table
ALTER TABLE public.snapshots
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS preview_snippet text,
  ADD COLUMN IF NOT EXISTS keyword_hits text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS keyword_score real DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seniority_hint boolean DEFAULT false;
