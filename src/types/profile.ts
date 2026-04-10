export interface UserProfile {
  id: string;
  user_id: string;
  summary: string;
  target_locations: string[];
  target_seniority: string[];
  target_industries: string[];
  preferred_functions: string[];
  hard_skills: string[];
  excluded_job_types: string[];
  preferred_career_tracks: string[];
  created_at: string;
  updated_at: string;
}

export interface StoredResume {
  id: string;
  user_id: string;
  career_track: string | null;
  is_master: boolean;
  file_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}
