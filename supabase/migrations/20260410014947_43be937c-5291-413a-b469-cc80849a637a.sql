CREATE POLICY "Users can update own versions"
ON public.application_versions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);