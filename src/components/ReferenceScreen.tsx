import { useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, ArrowLeft, ArrowRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { ReferenceFile, ReferenceTag } from "@/types/application";

interface ReferenceScreenProps {
  references: ReferenceFile[];
  referenceInfluence: number;
  onReferencesChange: (refs: ReferenceFile[]) => void;
  onReferenceInfluenceChange: (value: number) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const TAG_OPTIONS: { value: ReferenceTag; label: string }[] = [
  { value: "strong-resume", label: "Strong Resume" },
  { value: "strong-cover-letter", label: "Strong Cover Letter" },
  { value: "general-reference", label: "General Reference" },
];

export function ReferenceScreen({ references, referenceInfluence, onReferencesChange, onReferenceInfluenceChange, onNext, onSkip, onBack }: ReferenceScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newRefs: ReferenceFile[] = files.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      tag: "general-reference" as ReferenceTag,
    }));
    onReferencesChange([...references, ...newRefs]);
    e.target.value = "";
  };

  const removeRef = (id: string) => onReferencesChange(references.filter((r) => r.id !== id));
  const updateTag = (id: string, tag: ReferenceTag) =>
    onReferencesChange(references.map((r) => (r.id === id ? { ...r, tag } : r)));

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h2 className="text-3xl font-semibold text-foreground mb-2">Reference Materials</h2>
        <p className="text-muted-foreground mb-2">
          Optional: Upload your best past applications to improve personalization.
        </p>
        <p className="text-sm text-muted-foreground/70 mb-8">
          The system learns your style but will not copy content.
        </p>

        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" multiple className="hidden" onChange={handleFiles} />

        {references.length > 0 && (
          <div className="space-y-3 mb-6">
            {references.map((ref) => (
              <div key={ref.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <FileText className="h-5 w-5 text-accent shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{ref.file.name}</span>
                <Select value={ref.tag} onValueChange={(v) => updateTag(ref.id, v as ReferenceTag)}>
                  <SelectTrigger className="w-[160px] h-8 text-xs bg-secondary border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAG_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button onClick={() => removeRef(ref.id)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed border-border bg-card/40 hover:bg-card hover:border-muted-foreground/30 transition-colors cursor-pointer mb-8"
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Click to upload reference documents</span>
          <span className="text-xs text-muted-foreground/60">PDF, DOC, DOCX, or TXT — multiple files allowed</span>
        </button>

        {references.length > 0 && (
          <div className="mb-8 p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Reference Influence</span>
              <span className="text-sm tabular-nums text-muted-foreground">{referenceInfluence}%</span>
            </div>
            <Slider
              value={[referenceInfluence]}
              onValueChange={([v]) => onReferenceInfluenceChange(v)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-muted-foreground/60">Less influence</span>
              <span className="text-xs text-muted-foreground/60">More influence</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={onSkip}
            variant="outline"
            className="flex-1 h-11 gap-2 border-border text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-4 w-4" />
            Skip this step
          </Button>
          <Button
            onClick={onNext}
            disabled={references.length === 0}
            className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
