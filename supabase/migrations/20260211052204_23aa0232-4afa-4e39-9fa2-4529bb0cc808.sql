
-- Add description column for full JD text from external collector
ALTER TABLE public.snapshots ADD COLUMN IF NOT EXISTS description text;

-- Add skills array column for extracted skills from JD
ALTER TABLE public.snapshots ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}'::text[];

-- Add company_name column
ALTER TABLE public.snapshots ADD COLUMN IF NOT EXISTS company_name text;

-- Add location detail column
ALTER TABLE public.snapshots ADD COLUMN IF NOT EXISTS location_detail text;

-- Add salary_range column
ALTER TABLE public.snapshots ADD COLUMN IF NOT EXISTS salary_range text;

-- Add source_url column (the actual job posting URL, separate from search URL)
ALTER TABLE public.snapshots ADD COLUMN IF NOT EXISTS source_url text;

-- Create trend_metrics table for precomputed daily metrics
CREATE TABLE IF NOT EXISTS public.trend_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  role text NOT NULL,
  region text NOT NULL,
  total_jobs integer NOT NULL DEFAULT 0,
  avg_keyword_score real NOT NULL DEFAULT 0,
  top_skills text[] DEFAULT '{}'::text[],
  new_jobs integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date, role, region)
);

ALTER TABLE public.trend_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read trend_metrics"
ON public.trend_metrics FOR SELECT
USING (true);

CREATE POLICY "Allow public insert trend_metrics"
ON public.trend_metrics FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update trend_metrics"
ON public.trend_metrics FOR UPDATE
USING (true);
