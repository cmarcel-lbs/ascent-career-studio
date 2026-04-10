import { useState, useRef } from "react";
import { useResumes } from "@/hooks/useResumes";
import { CAREER_TRACKS } from "@/types/application";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Trash2, Crown } from "lucide-react";
import { extractFileText } from "@/lib/extractFileText";
import { toast } from "sonner";

const LANE_RESUMES = [
  { track: "investment-banking", label: "Investment Banking" },
  { track: "private-equity", label: "Private Equity" },
  { track: "venture-capital", label: "Venture Capital" },
  { track: "product-management", label: "Product Management" },
  { track: "growth-strategy", label: "Growth & Strategy" },
];

export function ResumesPage() {
  const { resumes, loading, saveResume, deleteResume } = useResumes();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const masterResume = resumes.find((r) => r.is_master);

  const handleUpload = async (file: File, careerTrack: string | null, isMaster: boolean) => {
    const key = isMaster ? "master" : careerTrack || "";
    setUploading(key);
    try {
      const content = await extractFileText(file);
      if (!content || content.length < 30) {
        toast.error("File appears empty or unreadable");
        return;
      }
      await saveResume({
        career_track: careerTrack,
        is_master: isMaster,
        file_name: file.name,
        content,
      });
    } catch (err) {
      toast.error("Failed to process file");
    } finally {
      setUploading(null);
    }
  };

  const ResumeSlot = ({
    title,
    trackKey,
    isMaster,
    existing,
  }: {
    title: string;
    trackKey: string | null;
    isMaster: boolean;
    existing: typeof resumes[0] | undefined;
  }) => {
    const inputId = `resume-${isMaster ? "master" : trackKey}`;
    return (
      <Card className={isMaster ? "border-accent/30" : ""}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isMaster ? "bg-accent/10" : "bg-muted"}`}>
                {isMaster ? <Crown className="h-4 w-4 text-accent" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                {existing ? (
                  <p className="text-xs text-muted-foreground">{existing.file_name}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">No resume uploaded</p>
                )}
              </div>
            </div>
            <div className="flex gap-1.5">
              <input
                id={inputId}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, trackKey, isMaster);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={uploading === (isMaster ? "master" : trackKey || "")}
                onClick={() => document.getElementById(inputId)?.click()}
              >
                <Upload className="h-3 w-3 mr-1" />
                {uploading === (isMaster ? "master" : trackKey || "")
                  ? "Uploading..."
                  : existing
                  ? "Replace"
                  : "Upload"}
              </Button>
              {existing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive"
                  onClick={() => deleteResume(existing.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-1">Resumes</h1>
        <p className="text-sm text-muted-foreground">
          Store your master resume and lane-specific versions for quick tailoring.
        </p>
      </div>

      <div className="space-y-4">
        <ResumeSlot title="Master Resume" trackKey={null} isMaster={true} existing={masterResume} />

        <div className="pt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Lane-Specific Resumes
          </h2>
          <div className="space-y-2">
            {LANE_RESUMES.map((lane) => {
              const existing = resumes.find((r) => r.career_track === lane.track && !r.is_master);
              return (
                <ResumeSlot
                  key={lane.track}
                  title={lane.label}
                  trackKey={lane.track}
                  isMaster={false}
                  existing={existing}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
