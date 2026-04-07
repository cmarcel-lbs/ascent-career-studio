import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { GeneratedResults } from "@/types/application";
import { toast } from "sonner";

export interface SavedVersion {
  id: string;
  career_track: string;
  job_description_snippet: string;
  resume: string;
  cover_letter: string;
  insights: GeneratedResults["insights"];
  reference_influence: number;
  version_label: string | null;
  created_at: string;
}

export function useVersionHistory() {
  const { user } = useAuth();
  const [versions, setVersions] = useState<SavedVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVersions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("application_versions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch versions:", error);
    } else {
      setVersions((data ?? []) as unknown as SavedVersion[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const saveVersion = useCallback(
    async (params: {
      careerTrack: string;
      jobDescription: string;
      results: GeneratedResults;
      referenceInfluence: number;
      label?: string;
    }) => {
      if (!user) return;
      const { error } = await supabase.from("application_versions").insert([{
        user_id: user.id,
        career_track: params.careerTrack,
        job_description_snippet: params.jobDescription.slice(0, 200),
        resume: params.results.resume,
        cover_letter: params.results.coverLetter,
        insights: params.results.insights as any,
        reference_influence: params.referenceInfluence,
        version_label: params.label ?? null,
      }]);

      if (error) {
        toast.error("Failed to save version");
        console.error(error);
      } else {
        toast.success("Version saved");
        fetchVersions();
      }
    },
    [user, fetchVersions]
  );

  const deleteVersion = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("application_versions").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete version");
      } else {
        setVersions((v) => v.filter((ver) => ver.id !== id));
        toast.success("Version deleted");
      }
    },
    []
  );

  return { versions, loading, saveVersion, deleteVersion, fetchVersions };
}
