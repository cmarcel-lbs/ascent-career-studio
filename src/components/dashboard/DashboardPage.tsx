import { useMemo } from "react";
import { useJobs } from "@/hooks/useJobs";
import { useProfile } from "@/hooks/useProfile";
import { useResumes } from "@/hooks/useResumes";
import { scoreJob } from "@/lib/matchEngine";
import { CAREER_TRACKS, type CareerTrack } from "@/types/application";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, TrendingUp, Rocket, Box, BarChart3, Star, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRACK_ICONS: Record<CareerTrack, React.ElementType> = {
  "investment-banking": Briefcase,
  "private-equity": TrendingUp,
  "venture-capital": Rocket,
  "product-management": Box,
  "growth-strategy": BarChart3,
};

const TRACK_COLORS: Record<CareerTrack, string> = {
  "investment-banking": "from-blue-600/10 to-blue-800/5 border-blue-200/50",
  "private-equity": "from-emerald-600/10 to-emerald-800/5 border-emerald-200/50",
  "venture-capital": "from-violet-600/10 to-violet-800/5 border-violet-200/50",
  "product-management": "from-amber-600/10 to-amber-800/5 border-amber-200/50",
  "growth-strategy": "from-rose-600/10 to-rose-800/5 border-rose-200/50",
};

interface Props {
  onNavigateToJobs: () => void;
  onNavigateToJob: (jobId: string) => void;
}

export function DashboardPage({ onNavigateToJobs, onNavigateToJob }: Props) {
  const { jobs, savedJobs, applications, loading } = useJobs();
  const { profile } = useProfile();
  const { resumes } = useResumes();

  const trackStats = useMemo(() => {
    const stats: Record<string, { total: number; highMatch: number; saved: number; applied: number }> = {};
    CAREER_TRACKS.forEach((t) => {
      const trackJobs = jobs.filter((j) => j.career_track === t.value);
      const scored = trackJobs.map((j) => ({ job: j, match: scoreJob(j, profile, resumes) }));
      stats[t.value] = {
        total: trackJobs.length,
        highMatch: scored.filter((s) => s.match.score >= 70).length,
        saved: savedJobs.filter((s) => s.status === "saved" && trackJobs.some((j) => j.id === s.job_id)).length,
        applied: applications.filter((a) => trackJobs.some((j) => j.id === a.job_id)).length,
      };
    });
    return stats;
  }, [jobs, savedJobs, applications, profile, resumes]);

  const topJobs = useMemo(() => {
    return jobs
      .map((j) => ({ ...j, match: scoreJob(j, profile, resumes) }))
      .filter((j) => !savedJobs.find((s) => s.job_id === j.id && s.status === "hidden"))
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 5);
  }, [jobs, profile, resumes, savedJobs]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Jobs Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Discover and prioritize opportunities across your target career tracks.
        </p>
      </div>

      {/* Career Lane Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {CAREER_TRACKS.map((track) => {
          const Icon = TRACK_ICONS[track.value];
          const stats = trackStats[track.value];
          return (
            <Card
              key={track.value}
              className={`bg-gradient-to-br ${TRACK_COLORS[track.value]} border cursor-pointer hover:shadow-md transition-shadow`}
              onClick={onNavigateToJobs}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-card flex items-center justify-center">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">{track.label}</h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
                    <p className="text-[11px] text-muted-foreground">Jobs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{stats?.highMatch || 0}</p>
                    <p className="text-[11px] text-muted-foreground">High Match</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{stats?.saved || 0}</p>
                    <p className="text-[11px] text-muted-foreground">Saved</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{stats?.applied || 0}</p>
                    <p className="text-[11px] text-muted-foreground">Applied</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Best Fit This Week */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Best Fit For You</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onNavigateToJobs} className="text-accent">
            View All Jobs <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : topJobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Star className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mb-1">No jobs discovered yet</p>
              <p className="text-xs text-muted-foreground">
                Search for jobs to start building your pipeline.
              </p>
              <Button className="mt-4" size="sm" onClick={onNavigateToJobs}>
                Search Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {topJobs.map((job) => (
              <Card
                key={job.id}
                className="cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => onNavigateToJob(job.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                      job.match.score >= 80
                        ? "bg-success/10 text-success"
                        : job.match.score >= 60
                        ? "bg-accent/10 text-accent"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {job.match.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.company} · {job.location}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {CAREER_TRACKS.find((t) => t.value === job.career_track)?.label}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
