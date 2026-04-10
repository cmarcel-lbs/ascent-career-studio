import { useMemo, useState, useRef, DragEvent, useEffect } from "react";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { CAREER_TRACKS } from "@/types/application";
import type { ApplicationStatus, JobApplication, Job } from "@/types/jobs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Star,
  Send,
  CheckCircle2,
  MessageSquare,
  Trophy,
  XCircle,
  Inbox,
  GripVertical,
  Link2,
  RefreshCw,
  Upload,
  Download,
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

const NOTION_TOKEN_KEY = "ascent_notion_token";
const NOTION_DB_KEY = "ascent_notion_db_id";

export function TrackerPage({ onNavigateToJob }: Props) {
  const { jobs, applications, updateApplication, loading, refetch } = useJobs();
  const { user } = useAuth();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);

  // Notion sync state
  const [showNotionSetup, setShowNotionSetup] = useState(false);
  const [notionToken, setNotionToken] = useState(() => localStorage.getItem(NOTION_TOKEN_KEY) || "");
  const [notionDbId, setNotionDbId] = useState(() => localStorage.getItem(NOTION_DB_KEY) || "");
  const [notionSyncing, setNotionSyncing] = useState(false);
  const isNotionConfigured = !!(notionToken && notionDbId);

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

  const saveNotionConfig = () => {
    localStorage.setItem(NOTION_TOKEN_KEY, notionToken);
    localStorage.setItem(NOTION_DB_KEY, notionDbId);
    setShowNotionSetup(false);
    toast.success("Notion connected");
  };

  const notionSync = async (direction: "push" | "pull") => {
    if (!isNotionConfigured || !user) {
      setShowNotionSetup(true);
      return;
    }
    setNotionSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("notion-sync", {
        body: {
          action: direction,
          userId: user.id,
          notionToken,
          notionDatabaseId: notionDbId,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (direction === "push") {
        toast.success(`Pushed ${data.synced} application${data.synced !== 1 ? "s" : ""} to Notion`);
      } else {
        toast.success(`Pulled ${data.updated} status update${data.updated !== 1 ? "s" : ""} from Notion`);
        await refetch();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Notion sync failed");
    } finally {
      setNotionSyncing(false);
    }
  };

  // Auto push to Notion on status change
  const handleUpdateWithSync = async (jobId: string, updates: Parameters<typeof updateApplication>[1], app: JobApplication & { job?: Job }) => {
    await updateApplication(jobId, updates);
    if (isNotionConfigured && updates.status && user) {
      try {
        await supabase.functions.invoke("notion-sync", {
          body: {
            action: "push-single",
            notionToken,
            notionDatabaseId: notionDbId,
            application: {
              jobId,
              status: updates.status,
              jobTitle: app.job?.title || "Unknown Role",
              company: app.job?.company || "",
              jobTrack: app.job?.career_track || "",
              notes: app.notes || "",
            },
          },
        });
      } catch {
        // Non-blocking — don't show error for background sync
      }
    }
  };

  const handleDragStart = (e: DragEvent, appId: string, jobId: string, currentStatus: ApplicationStatus) => {
    setDraggedId(appId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ appId, jobId, from: currentStatus }));
  };

  const handleDragOver = (e: DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: DragEvent, targetStatus: ApplicationStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDraggedId(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.from !== targetStatus) {
        const draggedApp = applications.find((a) => a.id === data.appId);
        const draggedJob = jobs.find((j) => j.id === data.jobId);
        await handleUpdateWithSync(data.jobId, { status: targetStatus }, { ...draggedApp!, job: draggedJob });
      }
    } catch {}
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverColumn(null);
  };

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-1">Application Tracker</h1>
            <p className="text-sm text-muted-foreground">
              {totalApps} application{totalApps !== 1 ? "s" : ""} across all stages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => notionSync("pull")}
              disabled={notionSyncing}
            >
              <Download className="h-3.5 w-3.5" />
              Pull from Notion
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => notionSync("push")}
              disabled={notionSyncing}
            >
              <Upload className="h-3.5 w-3.5" />
              Push to Notion
            </Button>
            <Button
              variant={isNotionConfigured ? "ghost" : "secondary"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setShowNotionSetup(true)}
            >
              <Link2 className="h-3.5 w-3.5" />
              {isNotionConfigured ? "Notion ✓" : "Connect Notion"}
            </Button>
          </div>
        </div>
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
              const isOver = dragOverColumn === col.value;
              return (
                <div
                  key={col.value}
                  className={`w-[260px] shrink-0 flex flex-col rounded-xl transition-colors duration-150 ${
                    isOver ? "bg-accent/10 ring-2 ring-accent/30" : "bg-muted/30"
                  }`}
                  onDragOver={(e) => handleDragOver(e, col.value)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.value)}
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
                      {items.map((app) => {
                        const isDragging = draggedId === app.id;
                        return (
                          <Card
                            key={app.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, app.id, app.job_id, col.value)}
                            onDragEnd={handleDragEnd}
                            className={`cursor-grab active:cursor-grabbing hover:shadow-sm transition-all ${
                              isDragging ? "opacity-40 scale-95" : ""
                            }`}
                            onClick={() => app.job && onNavigateToJob(app.job_id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-1.5">
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {app.job?.title || "Unknown Role"}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {app.job?.company || "Unknown Company"}
                                  </p>
                                </div>
                              </div>

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
                            </CardContent>
                          </Card>
                        );
                      })}

                      {items.length === 0 && (
                        <div className="py-8 text-center">
                          <p className="text-[10px] text-muted-foreground/50">Drop here</p>
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

      {/* Notion Setup Dialog */}
      <Dialog open={showNotionSetup} onOpenChange={setShowNotionSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Notion</DialogTitle>
            <DialogDescription>
              Sync your tracker with a Notion database. You need an Internal Integration Token and the Database ID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Integration Token</Label>
              <Input
                type="password"
                placeholder="secret_xxxxxxxxxxxx"
                value={notionToken}
                onChange={(e) => setNotionToken(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Create at notion.so/my-integrations → New integration → Internal. Grant it access to your database.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Database ID</Label>
              <Input
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={notionDbId}
                onChange={(e) => setNotionDbId(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Found in your Notion database URL: notion.so/workspace/<strong>DATABASE_ID</strong>?v=...
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-[11px] text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Required Notion database properties:</p>
              <p>• <code>Name</code> (title) — Job title</p>
              <p>• <code>Company</code> (text) — Company name</p>
              <p>• <code>Status</code> (select) — Interested / Applying / Applied / Interviewing / Offer / Rejected</p>
              <p>• <code>Career Track</code> (select) — Track name</p>
              <p>• <code>Job ID</code> (text) — Internal ID (auto-managed)</p>
              <p>• <code>Notes</code> (text, optional)</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowNotionSetup(false)}>Cancel</Button>
              <Button size="sm" onClick={saveNotionConfig} disabled={!notionToken || !notionDbId}>
                Save & Connect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
