import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { StoredResume } from "@/types/profile";
import { toast } from "sonner";

export function useResumes() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResumes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching resumes:", error);
    setResumes((data as StoredResume[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const saveResume = useCallback(
    async (resume: { career_track: string | null; is_master: boolean; file_name: string; content: string }) => {
      if (!user) return;
      // Upsert: if a resume with same career_track exists for this user, update it
      if (resume.is_master) {
        const existing = resumes.find((r) => r.is_master);
        if (existing) {
          const { error } = await supabase
            .from("resumes")
            .update({ file_name: resume.file_name, content: resume.content })
            .eq("id", existing.id);
          if (error) { toast.error("Failed to update resume"); return; }
          toast.success("Master resume updated");
          await fetchResumes();
          return;
        }
      } else if (resume.career_track) {
        const existing = resumes.find((r) => r.career_track === resume.career_track && !r.is_master);
        if (existing) {
          const { error } = await supabase
            .from("resumes")
            .update({ file_name: resume.file_name, content: resume.content })
            .eq("id", existing.id);
          if (error) { toast.error("Failed to update resume"); return; }
          toast.success("Resume updated");
          await fetchResumes();
          return;
        }
      }

      const { error } = await supabase
        .from("resumes")
        .insert({ user_id: user.id, ...resume });
      if (error) { toast.error("Failed to save resume"); return; }
      toast.success("Resume saved");
      await fetchResumes();
    },
    [user, resumes, fetchResumes]
  );

  const deleteResume = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("resumes").delete().eq("id", id);
      if (error) { toast.error("Failed to delete resume"); return; }
      toast.success("Resume deleted");
      await fetchResumes();
    },
    [fetchResumes]
  );

  return { resumes, loading, saveResume, deleteResume, refetch: fetchResumes };
}
