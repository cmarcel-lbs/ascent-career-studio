import { useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { TrackState } from "@/types/workspace";
import type { ReferenceFile, ReferenceTag } from "@/types/application";

interface TrackWorkspaceProps {
  trackState: TrackState;
  onUpdate: (patch: Partial<TrackState>) => void;
  onGenerate: () => void;
}

const TAG_OPTIONS: { value: ReferenceTag; label: string }[] = [
  { value: "strong-resume", label: "Strong Resume" },
  { value: "strong-cover-letter", label: "Strong Cover Letter" },
  { value: "general-reference", label: "General Reference" },
];

export function TrackWorkspace({ trackState, onUpdate, onGenerate }: TrackWorkspaceProps) {
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  const { baseResume, jobDescription, references, referenceInfluence, isProcessing } = trackState;
  const isValid = baseResume && jobDescription.trim().length > 20;

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ baseResume: e.target.files?.[0] ?? null });
  };

  const handleRefFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newRefs: ReferenceFile[] = files.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      tag: "general-reference" as ReferenceTag,
    }));
    onUpdate({ references: [...references, ...newRefs] });
    e.target.value = "";
  };

  const removeRef = (id: string) => onUpdate({ references: references.filter((r) => r.id !== id) });
  const updateTag = (id: string, tag: ReferenceTag) =>
    onUpdate({ references: references.map((r) => (r.id === id ? { ...r, tag } : r)) });

  return (
    <div className="space-y-8">
      {/* Resume Upload */}
      <section>
        <h3 className="text-sm font-medium text-foreground mb-3">Base Resume *</h3>
        <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleResumeChange} />
        {baseResume ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
            <FileText className="h-5 w-5 text-accent shrink-0" />
            <span className="text-sm text-foreground truncate flex-1">{baseResume.name}</span>
            <button onClick={() => onUpdate({ baseResume: null })} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => resumeInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border bg-card/40 hover:bg-card hover:border-muted-foreground/30 transition-colors cursor-pointer"
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Upload your resume</span>
            <span className="text-xs text-muted-foreground/60">PDF, DOC, DOCX, or TXT</span>
          </button>
        )}
      </section>

      {/* Job Description */}
      <section>
        <h3 className="text-sm font-medium text-foreground mb-3">Job Description *</h3>
        <Textarea
          value={jobDescription}
          onChange={(e) => onUpdate({ jobDescription: e.target.value })}
          placeholder="Paste the full job description here..."
          className="min-h-[160px] bg-card border-border resize-none text-sm"
        />
      </section>

      {/* Reference Materials */}
      <section>
        <h3 className="text-sm font-medium text-foreground mb-1">Reference Materials</h3>
        <p className="text-xs text-muted-foreground mb-3">Upload your best past applications to improve personalization.</p>
        <input ref={refInputRef} type="file" accept=".pdf,.doc,.docx,.txt" multiple className="hidden" onChange={handleRefFiles} />

        {references.length > 0 && (
          <div className="space-y-2 mb-3">
            {references.map((ref) => (
              <div key={ref.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
                <FileText className="h-4 w-4 text-accent shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{ref.file.name}</span>
                <Select value={ref.tag} onValueChange={(v) => updateTag(ref.id, v as ReferenceTag)}>
                  <SelectTrigger className="w-[140px] h-7 text-xs bg-secondary border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAG_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button onClick={() => removeRef(ref.id)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => refInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border bg-card/40 hover:bg-card hover:border-muted-foreground/30 transition-colors cursor-pointer"
        >
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Add reference documents</span>
        </button>

        {references.length > 0 && (
          <div className="mt-3 p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-foreground">Reference Influence</span>
              <span className="text-xs tabular-nums text-muted-foreground">{referenceInfluence}%</span>
            </div>
            <Slider
              value={[referenceInfluence]}
              onValueChange={([v]) => onUpdate({ referenceInfluence: v })}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground/60">Less</span>
              <span className="text-[10px] text-muted-foreground/60">More</span>
            </div>
          </div>
        )}
      </section>

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={!isValid || isProcessing}
        className="w-full h-11 gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Application
          </>
        )}
      </Button>
    </div>
  );
}
