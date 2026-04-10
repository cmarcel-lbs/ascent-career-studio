import { useMemo } from "react";
import { useJobs } from "@/hooks/useJobs";
import { CAREER_TRACKS } from "@/types/application";
import type { ApplicationStatus, JobApplication, Job } from "@/types/jobs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star,
  Send,
  CheckCircle2,
  MessageSquare,
  Trophy,
  XCircle,
  ArrowRight,
  Inbox,
} from "lucide-react";

const STATUS_COLUMNS: {
  value: ApplicationStatus;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: "interested", label: "Interested", icon: Star, color: "text-amber-500 bg-amber-500/10" },
  { value: "applying", label: "Applying", icon: Send, color: "text-blue-500 bg-blue-500/10" },
  { value: "applied", label: "Applied", icon: CheckCircle2, color: "text-accent bg-accent/10" },
  { value: "interviewing", label: "Interviewing", icon: MessageSquare, color: "text-violet-500 bg-violet-500/10" },
  { value: "offer", label: "Offer", icon: Trophy, color: "text-success bg-success/10" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "text-destructive bg-destructive/10" },
];

interface Props {
  onNavigateToJob: (jobId: string) => void;
}

export function TrackerPage({ onNavigateToJob }: Props) {
  const { jobs, applications, updateApplication, loading } = useJobs();

  const columns = useMemo(() => {
    const grouped: Record<ApplicationStatus, (JobApplication & { job?: Job })[]> = {
      interested: [],
      applying: [],
      applied: [],
      interviewing: [],
      offer: [],
      rejected: [],
    };

    applications.forEach((app) => {
      const job = jobs.find((j) => j.id === app.job_id);
      if (grouped[app.status as ApplicationStatus]) {
        grouped[app.status as ApplicationStatus].push({ ...app, job });
      }
    });

    return grouped;
  }, [applications, jobs]);

  const totalApps = applications.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-8 py-10">
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-semibold text-foreground mb-1">Application Tracker</h1>
        <p className="text-sm text-muted-foreground">
          {totalApps} application{totalApps !== 1 ? "s" : ""} across all stages
        </p>
      </div>

      {totalApps === 0 ? (
        <Card className="border-dashed max-w-lg">
          <CardContent className="py-16 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground mb-1">No applications yet</p>
            <p className="text-xs text-muted-foreground">
              Start by saving a job and marking it as "Interested" from the job details page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4" style={{ minHeight: "calc(100vh - 220px)" }}>
            {STATUS_COLUMNS.map((col) => {
              const items = columns[col.value];
              const Icon = col.icon;
              return (
                <div
                  key={col.value}
                  className="w-[260px] shrink-0 flex flex-col bg-muted/30 rounded-xl"
                >
                  {/* Column Header */}
                  <div className="px-3 py-3 flex items-center gap-2 shrink-0">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${col.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{col.label}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {items.length}
                    </Badge>
                  </div>

                  {/* Column Cards */}
                  <ScrollArea className="flex-1 px-2 pb-2">
                    <div className="space-y-2">
                      {items.map((app) => (
                        <Card
                          key={app.id}
                          className="cursor-pointer hover:shadow-sm transition-shadow"
                          onClick={() => app.job && onNavigateToJob(app.job_id)}
                        >
                          <CardContent className="p-3">
                            <p className="text-sm font-medium text-foreground truncate">
                              {app.job?.title || "Unknown Role"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {app.job?.company || "Unknown Company"}
                            </p>

                            {app.job && (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <Badge variant="secondary" className="text-[9px]">
                                  {CAREER_TRACKS.find((t) => t.value === app.job!.career_track)?.label}
                                </Badge>
                                {app.job.location && (
                                  <span className="text-[9px] text-muted-foreground">{app.job.location}</span>
                                )}
                              </div>
                            )}

                            {app.notes && (
                              <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 italic">
                                {app.notes}
                              </p>
                            )}

                            {/* Move buttons */}
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                              {STATUS_COLUMNS.filter((s) => s.value !== col.value)
                                .slice(0, 3)
                                .map((target) => (
                                  <Button
                                    key={target.value}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] px-1.5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateApplication(app.job_id, { status: target.value });
                                    }}
                                    title={`Move to ${target.label}`}
                                  >
                                    <target.icon className="h-3 w-3" />
                                  </Button>
                                ))}
                              <ArrowRight className="h-3 w-3 text-muted-foreground/30 ml-auto" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {items.length === 0 && (
                        <div className="py-8 text-center">
                          <p className="text-[10px] text-muted-foreground/50">No applications</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
