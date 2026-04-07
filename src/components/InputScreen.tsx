import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, ArrowRight, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CAREER_TRACKS, type CareerTrack } from "@/types/application";

interface InputScreenProps {
  careerTrack: CareerTrack | null;
  baseResume: File | null;
  jobDescription: string;
  onCareerTrackChange: (track: CareerTrack) => void;
  onResumeChange: (file: File | null) => void;
  onJobDescriptionChange: (desc: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function InputScreen({
  careerTrack,
  baseResume,
  jobDescription,
  onCareerTrackChange,
  onResumeChange,
  onJobDescriptionChange,
  onNext,
  onBack,
}: InputScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isValid = careerTrack && baseResume && jobDescription.trim().length > 20;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onResumeChange(file);
  };

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

        <h2 className="text-3xl font-semibold text-foreground mb-2">Application Details</h2>
        <p className="text-muted-foreground mb-10">Provide the essentials so we can generate tailored materials.</p>

        <div className="space-y-6">
          {/* Career Track */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Career Track *</label>
            <Select value={careerTrack ?? undefined} onValueChange={(v) => onCareerTrackChange(v as CareerTrack)}>
              <SelectTrigger className="h-11 bg-card border-border">
                <SelectValue placeholder="Select your target career track" />
              </SelectTrigger>
              <SelectContent>
                {CAREER_TRACKS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Base Resume *</label>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileChange} />
            {baseResume ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <FileText className="h-5 w-5 text-accent shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{baseResume.name}</span>
                <button onClick={() => onResumeChange(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed border-border bg-card/40 hover:bg-card hover:border-muted-foreground/30 transition-colors cursor-pointer"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload your resume</span>
                <span className="text-xs text-muted-foreground/60">PDF, DOC, DOCX, or TXT</span>
              </button>
            )}
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Job Description *</label>
            <Textarea
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              placeholder="Paste the full job description here..."
              className="min-h-[180px] bg-card border-border resize-none text-sm"
            />
          </div>

          <Button
            onClick={onNext}
            disabled={!isValid}
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
