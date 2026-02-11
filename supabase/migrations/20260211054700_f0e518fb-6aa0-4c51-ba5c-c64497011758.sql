
-- Add geolocation and distance columns to snapshots
ALTER TABLE public.snapshots
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS distance_km double precision;

-- Index for distance-based queries
CREATE INDEX IF NOT EXISTS idx_snapshots_distance_km ON public.snapshots (distance_km)
  WHERE distance_km IS NOT NULL;
