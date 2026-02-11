
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Allow public insert access" ON public.snapshots;
DROP POLICY IF EXISTS "Allow public read access" ON public.snapshots;
DROP POLICY IF EXISTS "Allow public delete access" ON public.snapshots;

CREATE POLICY "Allow public read access" ON public.snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON public.snapshots FOR DELETE USING (true);
CREATE POLICY "Allow public update access" ON public.snapshots FOR UPDATE USING (true);
