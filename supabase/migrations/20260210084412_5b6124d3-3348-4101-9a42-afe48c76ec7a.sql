
-- Add platform column to snapshots
ALTER TABLE public.snapshots ADD COLUMN platform TEXT NOT NULL DEFAULT 'LinkedIn';

-- Drop old unique constraint and create new one including platform
ALTER TABLE public.snapshots DROP CONSTRAINT unique_snapshot;
ALTER TABLE public.snapshots ADD CONSTRAINT unique_snapshot UNIQUE (date, role, region, platform);
