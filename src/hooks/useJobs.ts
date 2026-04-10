import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Job, SavedJob, JobApplication, JobWithMatch, JobFilters, DEFAULT_FILTERS } from "@/types/jobs";
import { toast } from "sonner";
import { subDays } from "date-fns";

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(null);

    try {
      const [jobsRes, savedRes, appsRes] = await Promise.all([
        supabase.from("jobs").select("*").order("posted_date", { ascending: false }),
        supabase.from("saved_jobs").select("*").eq("user_id", user.id),
        supabase.from("job_applications").select("*").eq("user_id", user.id),
      ]);

      if (jobsRes.error) throw new Error(`Jobs: ${jobsRes.error.message}`);
      if (savedRes.error) throw new Error(`Saved jobs: ${savedRes.error.message}`);
      if (appsRes.error) throw new Error(`Applications: ${appsRes.error.message}`);

      setJobs(jobsRes.data as Job[]);
      setSavedJobs(savedRes.data as SavedJob[]);
      setApplications(appsRes.data as JobApplication[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load jobs";
      setFetchError(msg);
      console.error("useJobs fetchAll error:", err);
      toast.error("Failed to load jobs. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const saveJob = useCallback(
    async (jobId: string, status: "saved" | "hidden") => {
      if (!user) return;
      const existing = savedJobs.find((s) => s.job_id === jobId);
      if (existing) {
        if (existing.status === status) {
          await supabase.from("saved_jobs").delete().eq("id", existing.id);
          toast.success(status === "saved" ? "Unsaved" : "Unhidden");
        } else {
          await supabase.from("saved_jobs").update({ status }).eq("id", existing.id);
          toast.success(status === "saved" ? "Job saved" : "Job hidden");
        }
      } else {
        await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: jobId, status });
        toast.success(status === "saved" ? "Job saved" : "Job hidden");
      }
      await fetchAll();
    },
    [user, savedJobs, fetchAll]
  );

  const updateApplication = useCallback(
    async (jobId: string, updates: Partial<Pick<JobApplication, "status" | "tailored_resume" | "tailored_cover_letter" | "notes">>) => {
      if (!user) return;
      const existing = applications.find((a) => a.job_id === jobId);
      if (existing) {
        await supabase.from("job_applications").update(updates).eq("id", existing.id);
      } else {
        await supabase.from("job_applications").insert({ user_id: user.id, job_id: jobId, ...updates });
      }
      await fetchAll();
    },
    [user, applications, fetchAll]
  );

  const enrichJobs = useCallback(
    (jobList: Job[]): JobWithMatch[] => {
      return jobList.map((job) => {
        const saved = savedJobs.find((s) => s.job_id === job.id);
        const app = applications.find((a) => a.job_id === job.id);
        return {
          ...job,
          savedStatus: saved?.status || null,
          applicationStatus: app?.status || null,
        };
      });
    },
    [savedJobs, applications]
  );

  const filterJobs = useCallback(
    (filters: JobFilters): JobWithMatch[] => {
      let filtered = jobs.filter((j) => {
        const saved = savedJobs.find((s) => s.job_id === j.id);
        if (saved?.status === "hidden") return false;
        return true;
      });

      if (filters.careerTrack !== "all") {
        filtered = filtered.filter((j) => j.career_track === filters.careerTrack);
      }
      if (filters.location) {
        filtered = filtered.filter((j) => j.location.toLowerCase().includes(filters.location.toLowerCase()));
      }
      if (filters.source) {
        filtered = filtered.filter((j) => j.source.toLowerCase().includes(filters.source.toLowerCase()));
      }
      if (filters.workMode !== "all") {
        filtered = filtered.filter((j) => j.work_mode === filters.workMode);
      }
      if (filters.seniority) {
        filtered = filtered.filter((j) => j.seniority.toLowerCase().includes(filters.seniority.toLowerCase()));
      }
      if (filters.datePosted !== "any") {
        const days = { day: 1, week: 7, month: 30 }[filters.datePosted];
        const cutoff = subDays(new Date(), days);
        filtered = filtered.filter((j) => new Date(j.posted_date) >= cutoff);
      }

      return enrichJobs(filtered);
    },
    [jobs, savedJobs, enrichJobs]
  );

  return { jobs, savedJobs, applications, loading, fetchError, saveJob, updateApplication, filterJobs, enrichJobs, refetch: fetchAll };
}
