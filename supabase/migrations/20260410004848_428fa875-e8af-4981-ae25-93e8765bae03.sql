
DROP POLICY "Service role can insert jobs" ON public.jobs;

-- No INSERT policy for authenticated users. Jobs are inserted via edge functions using service role key.
-- The service role bypasses RLS entirely, so no INSERT policy is needed.
