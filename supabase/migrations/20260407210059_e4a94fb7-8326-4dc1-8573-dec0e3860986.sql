
-- Create application_versions table
CREATE TABLE public.application_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  career_track TEXT NOT NULL,
  job_description_snippet TEXT NOT NULL DEFAULT '',
  resume TEXT NOT NULL,
  cover_letter TEXT NOT NULL,
  insights JSONB NOT NULL DEFAULT '{}',
  reference_influence INTEGER NOT NULL DEFAULT 50,
  version_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_versions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own versions
CREATE POLICY "Users can view own versions"
ON public.application_versions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own versions
CREATE POLICY "Users can create own versions"
ON public.application_versions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own versions
CREATE POLICY "Users can delete own versions"
ON public.application_versions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_app_versions_user_id ON public.application_versions(user_id, created_at DESC);
