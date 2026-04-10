import { useMemo, useState } from "react";
import { useJobs } from "@/hooks/useJobs";
import { useProfile } from "@/hooks/useProfile";
import { useResumes } from "@/hooks/useResumes";
import { scoreJob } from "@/lib/matchEngine";
import { CAREER_TRACKS } from "@/types/application";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  FileText,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ApplicationStatus } from "@/types/jobs";

interface Props {
  jobId: string;
  onBack: () => void;
  onNavigateToStudio: (jobDescription?: string, mode?: "resume" | "cover-letter") => void;
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "interested", label: "Interested" },
  { value: "applying", label: "Applying" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

export function JobDetailPage({ jobId, onBack, onNavigateToStudio }: Props) {
  const { jobs, savedJobs, applications, saveJob, updateApplication } = useJobs();
  const { profile } = useProfile();
  const { resumes } = useResumes();
  const [aiExplaining, setAiExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const job = jobs.find((j) => j.id === jobId);
  const saved = savedJobs.find((s) => s.job_id === jobId);
  const application = applications.find((a) => a.job_id === jobId);

  const match = useMemo(() => {
    if (!job) return null;
    return scoreJob(job, profile, resumes);
  }, [job, profile, resumes]);

  const handleAIExplain = async () => {
    if (!job) return;
    setAiExplaining(true);
    try {
      const { data, error } = await supabase.functions.invoke("match-jobs", {
        body: {
          jobTitle: job.title,
          jobDescription: job.description,
          profileSummary: profile?.summary || "",
          skills: profile?.hard_skills || [],
          resumeContent: resumes.find((r) => r.is_master)?.content || "",
        },
      });
      if (error) throw new Error(error.message);
      setAiExplanation(data?.explanation || "No detailed analysis available.");
    } catch (err) {
      toast.error("Failed to get AI analysis");
    } finally {
      setAiExplaining(false);
    }
  };

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-10">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
        <p className="text-muted-foreground">Job not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Jobs
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div
            className={`h-14 w-14 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
              (match?.score || 0) >= 80
                ? "bg-success/10 text-success"
                : (match?.score || 0) >= 60
                ? "bg-accent/10 text-accent"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {match?.score || "—"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">{job.title}</h1>
            <p className="text-base text-muted-foreground mt-0.5">{job.company}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary">
                {CAREER_TRACKS.find((t) => t.value === job.career_track)?.label}
              </Badge>
              {job.location && <Badge variant="outline">{job.location}</Badge>}
              {job.work_mode !== "onsite" && <Badge variant="outline">{job.work_mode}</Badge>}
              {job.seniority && <Badge variant="outline">{job.seniority}</Badge>}
              <span className="text-xs text-muted-foreground">via {job.source}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button onClick={() => onNavigateToStudio(job.description, "resume")}>
          <FileText className="h-4 w-4 mr-2" />
          Tailor Resume
        </Button>
        <Button variant="outline" onClick={() => onNavigateToStudio(job.description, "cover-letter")}>
          <Mail className="h-4 w-4 mr-2" />
          Generate Cover Letter
        </Button>
        <Button
          variant="outline"
          onClick={() => saveJob(job.id, "saved")}
        >
          <Bookmark className={`h-4 w-4 mr-2 ${saved?.status === "saved" ? "fill-current" : ""}`} />
          {saved?.status === "saved" ? "Saved" : "Save Job"}
        </Button>
        <Button
          variant="outline"
          onClick={() => updateApplication(job.id, { status: "applied" })}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {application?.status === "applied" ? "Applied ✓" : "Mark Applied"}
        </Button>
        {job.source_url && (
          <Button variant="outline" onClick={() => window.open(job.source_url, "_blank")}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Job
          </Button>
        )}
      </div>

      {/* Application Status */}
      {application && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Application Status</p>
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <Badge
                  key={s.value}
                  variant={application.status === s.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => updateApplication(job.id, { status: s.value })}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Analysis */}
      {match && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              Match Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground">{match.summary}</p>

            {match.gaps.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Gaps
                </p>
                <ul className="space-y-1">
                  {match.gaps.map((gap, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {match.bestResume && (
              <p className="text-xs text-muted-foreground">
                Recommended resume: <span className="font-medium text-foreground">{match.bestResume}</span>
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleAIExplain}
              disabled={aiExplaining}
            >
              {aiExplaining ? "Analyzing..." : "Get AI Analysis"}
            </Button>

            {aiExplanation && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">
                {aiExplanation}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />

      {/* Job Description */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Job Description</h2>
        <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap">
          {job.description}
        </div>
      </div>
    </div>
  );
}
