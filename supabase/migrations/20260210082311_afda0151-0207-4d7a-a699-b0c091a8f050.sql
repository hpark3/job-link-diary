
-- Create snapshots table for job market index
CREATE TABLE public.snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  role TEXT NOT NULL,
  region TEXT NOT NULL,
  linkedin_search_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate snapshots per day/role/region
ALTER TABLE public.snapshots ADD CONSTRAINT unique_snapshot UNIQUE (date, role, region);

-- Enable RLS but allow public access (single-user internal tool)
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON public.snapshots FOR DELETE USING (true);

-- Create index for date-based queries
CREATE INDEX idx_snapshots_date ON public.snapshots (date DESC);
CREATE INDEX idx_snapshots_role ON public.snapshots (role);
CREATE INDEX idx_snapshots_region ON public.snapshots (region);
