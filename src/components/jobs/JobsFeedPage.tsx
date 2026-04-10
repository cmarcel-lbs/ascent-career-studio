import { useState, useMemo, useCallback } from "react";
import { useJobs } from "@/hooks/useJobs";
import { useProfile } from "@/hooks/useProfile";
import { useResumes } from "@/hooks/useResumes";
import { scoreJob } from "@/lib/matchEngine";
import { CAREER_TRACKS } from "@/types/application";
import { DEFAULT_FILTERS, type JobFilters, type JobWithMatch } from "@/types/jobs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Bookmark, EyeOff, ExternalLink, FileText, ArrowRight, Search, Loader2, LayoutGrid, List, Globe, LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onNavigateToJob: (jobId: string) => void;
  onNavigateToStudio: (jobDescription?: string, mode?: "resume" | "cover-letter") => void;
}

export function JobsFeedPage({ onNavigateToJob, onNavigateToStudio }: Props) {
  const { jobs, savedJobs, loading, saveJob, filterJobs, refetch } = useJobs();
  const { profile } = useProfile();
  const { resumes } = useResumes();
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSource, setImportSource] = useState("auto");

  const handleImportFromUrl = useCallback(async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-jobs", {
        body: {
          url: importUrl,
          source: importSource === "auto" ? undefined : importSource,
          preferredTracks: profile?.preferred_career_tracks || [],
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const count = data?.jobsAdded || 0;
      if (count === 0) {
        toast.info("No job listings found on that page. Try a different URL.");
      } else {
        toast.success(`Imported ${count} job${count !== 1 ? "s" : ""} from the page`);
      }
      setImportUrl("");
      setShowImportDialog(false);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }, [importUrl, profile, refetch]);
  const filteredJobs = useMemo(() => {
    const filtered = filterJobs(filters);
    return filtered.map((j) => ({
      ...j,
      match: scoreJob(j, profile, resumes),
    }));
  }, [filterJobs, filters, profile, resumes]);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs]
      .filter((j) => {
        if (filters.minMatchScore > 0 && j.match) return j.match.score >= filters.minMatchScore;
        return true;
      })
      .sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0));
  }, [filteredJobs, filters.minMatchScore]);

  const boardGroups = useMemo(() => {
    const groups: Record<string, JobWithMatch[]> = {};
    CAREER_TRACKS.forEach((t) => { groups[t.value] = []; });
    sortedJobs.forEach((j) => {
      if (groups[j.career_track]) groups[j.career_track].push(j);
    });
    return groups;
  }, [sortedJobs]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-jobs", {
        body: {
          query: searchQuery,
          profileSummary: profile?.summary || "",
          skills: profile?.hard_skills || [],
          preferredTracks: profile?.preferred_career_tracks || [],
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success(`Found ${data?.jobsAdded || 0} new jobs`);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, [searchQuery, profile, refetch]);

  const JobCard = ({ job }: { job: JobWithMatch & { match?: { score: number; summary: string } } }) => {
    const isSaved = savedJobs.find((s) => s.job_id === job.id && s.status === "saved");
    return (
      <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => onNavigateToJob(job.id)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                (job.match?.score || 0) >= 80
                  ? "bg-success/10 text-success"
                  : (job.match?.score || 0) >= 60
                  ? "bg-accent/10 text-accent"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {job.match?.score || "—"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
              <p className="text-xs text-muted-foreground">{job.company}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">
                  {CAREER_TRACKS.find((t) => t.value === job.career_track)?.label}
                </Badge>
                {job.location && (
                  <span className="text-[10px] text-muted-foreground">{job.location}</span>
                )}
                {job.work_mode !== "onsite" && (
                  <Badge variant="outline" className="text-[10px]">{job.work_mode}</Badge>
                )}
                <span className="text-[10px] text-muted-foreground">{job.source}</span>
              </div>
              {job.match?.summary && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{job.match.summary}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => { e.stopPropagation(); saveJob(job.id, "saved"); }}
            >
              <Bookmark className={`h-3 w-3 mr-1 ${isSaved ? "fill-current" : ""}`} />
              {isSaved ? "Saved" : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => { e.stopPropagation(); saveJob(job.id, "hidden"); }}
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Hide
            </Button>
            {job.source_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => { e.stopPropagation(); window.open(job.source_url, "_blank"); }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs ml-auto text-accent"
              onClick={(e) => { e.stopPropagation(); onNavigateToStudio(job.description); }}
            >
              <FileText className="h-3 w-3 mr-1" />
              Tailor Resume
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-1">Jobs</h1>
          <p className="text-sm text-muted-foreground">{sortedJobs.length} jobs across all tracks</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowImportDialog(true)}>
          <Globe className="h-3.5 w-3.5" />
          Import from URL
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for jobs (e.g. 'investment banking analyst NYC')..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
          Search
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Select
          value={filters.careerTrack}
          onValueChange={(v) => setFilters((f) => ({ ...f, careerTrack: v as any }))}
        >
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Career Track" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tracks</SelectItem>
            {CAREER_TRACKS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.workMode}
          onValueChange={(v) => setFilters((f) => ({ ...f, workMode: v as any }))}
        >
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue placeholder="Work Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="onsite">Onsite</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.datePosted}
          onValueChange={(v) => setFilters((f) => ({ ...f, datePosted: v as any }))}
        >
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue placeholder="Date Posted" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Time</SelectItem>
            <SelectItem value="day">Past Day</SelectItem>
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Location..."
          className="w-[140px] h-9 text-xs"
          value={filters.location}
          onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
        />

        <div className="ml-auto flex gap-1">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "board" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("board")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {sortedJobs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No jobs found. Search to discover opportunities.</p>
              </CardContent>
            </Card>
          ) : (
            sortedJobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAREER_TRACKS.map((track) => (
            <div key={track.value}>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                {track.label}
                <Badge variant="secondary" className="text-[10px]">{boardGroups[track.value]?.length || 0}</Badge>
              </h3>
              <div className="space-y-2">
                {(boardGroups[track.value] || []).map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import from URL Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Jobs from URL</DialogTitle>
            <DialogDescription>
              Paste a job board or career page URL to scrape and import real job listings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Source / Board Type</label>
              <Select value={importSource} onValueChange={setImportSource}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Indeed">Indeed</SelectItem>
                  <SelectItem value="Greenhouse">Greenhouse</SelectItem>
                  <SelectItem value="Lever">Lever</SelectItem>
                  <SelectItem value="Workday">Workday</SelectItem>
                  <SelectItem value="Company Website">Company Website</SelectItem>
                  <SelectItem value="AngelList">AngelList / Wellfound</SelectItem>
                  <SelectItem value="Glassdoor">Glassdoor</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">URL</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://boards.greenhouse.io/company or LinkedIn jobs URL..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleImportFromUrl()}
                  className="pl-10 font-mono text-xs"
                />
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-[11px] text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Tips for best results:</p>
              <p>• Use search results pages with multiple listings</p>
              <p>• Company career pages (e.g. greenhouse.io/company)</p>
              <p>• Individual job posting URLs also work</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleImportFromUrl} disabled={importing || !importUrl.trim()}>
                {importing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5 mr-1.5" />
                    Import Jobs
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
