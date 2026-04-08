import { useRef, useState } from "react";
import { Upload, FileText, X, Sparkles, Loader2, Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { TrackState, SupportingMaterial } from "@/types/workspace";
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
  const supportingFileRef = useRef<HTMLInputElement>(null);
  const [linkInput, setLinkInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const { baseResume, jobDescription, additionalContext, supportingMaterials, references, referenceInfluence, isProcessing } = trackState;
  const isValid = baseResume && jobDescription.trim().length > 20;

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ baseResume: e.target.files?.[0] ?? null });
  };

  // Supporting materials handlers
  const handleSupportingFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newMaterials: SupportingMaterial[] = files.map((f) => ({
      id: crypto.randomUUID(),
      type: "file",
      file: f,
      label: f.name,
    }));
    onUpdate({ supportingMaterials: [...supportingMaterials, ...newMaterials] });
    e.target.value = "";
  };

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    const material: SupportingMaterial = {
      id: crypto.randomUUID(),
      type: "link",
      url,
      label: url,
    };
    onUpdate({ supportingMaterials: [...supportingMaterials, material] });
    setLinkInput("");
    setShowLinkInput(false);
  };

  const removeSupportingMaterial = (id: string) =>
    onUpdate({ supportingMaterials: supportingMaterials.filter((m) => m.id !== id) });

  // Reference handlers
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

      {/* Additional Context */}
      <section>
        <h3 className="text-sm font-medium text-foreground mb-1">Additional Context</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Add relevant experiences, projects, or details not in your resume that could strengthen the application.
        </p>
        <Textarea
          value={additionalContext}
          onChange={(e) => onUpdate({ additionalContext: e.target.value })}
          placeholder="E.g. 'Led a due diligence workstream on a $200M carve-out that isn't on my resume yet…' or 'Completed CFA Level II, relevant coursework in LBO modeling…'"
          className="min-h-[100px] bg-card border-border resize-none text-sm"
        />
      </section>


      <section>
        <h3 className="text-sm font-medium text-foreground mb-1">Supporting Materials</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Add docs, PDFs, or links that provide more context about the role (e.g. JD as PDF, company page, team info).
        </p>
        <input
          ref={supportingFileRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.html,.htm"
          multiple
          className="hidden"
          onChange={handleSupportingFiles}
        />

        {supportingMaterials.length > 0 && (
          <div className="space-y-2 mb-3">
            {supportingMaterials.map((mat) => (
              <div key={mat.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
                {mat.type === "file" ? (
                  <FileText className="h-4 w-4 text-accent shrink-0" />
                ) : (
                  <Link2 className="h-4 w-4 text-accent shrink-0" />
                )}
                <span className="text-xs text-foreground truncate flex-1">{mat.label}</span>
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider shrink-0">{mat.type}</span>
                <button onClick={() => removeSupportingMaterial(mat.id)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showLinkInput && (
          <div className="flex gap-2 mb-3">
            <Input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://..."
              className="text-sm bg-card border-border"
              onKeyDown={(e) => e.key === "Enter" && addLink()}
            />
            <Button variant="secondary" size="sm" onClick={addLink} disabled={!linkInput.trim()}>
              Add
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowLinkInput(false); setLinkInput(""); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => supportingFileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border bg-card/40 hover:bg-card hover:border-muted-foreground/30 transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Upload files</span>
          </button>
          {!showLinkInput && (
            <button
              onClick={() => setShowLinkInput(true)}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border bg-card/40 hover:bg-card hover:border-muted-foreground/30 transition-colors cursor-pointer"
            >
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add link</span>
            </button>
          )}
        </div>
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