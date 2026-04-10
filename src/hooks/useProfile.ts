import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/types/profile";
import { toast } from "sonner";

const EMPTY_PROFILE: Omit<UserProfile, "id" | "user_id" | "created_at" | "updated_at"> = {
  summary: "",
  target_locations: [],
  target_seniority: [],
  target_industries: [],
  preferred_functions: [],
  hard_skills: [],
  excluded_job_types: [],
  preferred_career_tracks: [],
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    }
    setProfile(data as UserProfile | null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = useCallback(
    async (updates: Partial<Omit<UserProfile, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!user) return;

      if (profile) {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", user.id);
        if (error) {
          toast.error("Failed to save profile");
          return;
        }
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert({ user_id: user.id, ...EMPTY_PROFILE, ...updates });
        if (error) {
          toast.error("Failed to create profile");
          return;
        }
      }
      toast.success("Profile saved");
      await fetchProfile();
    },
    [user, profile, fetchProfile]
  );

  return { profile, loading, saveProfile };
}
