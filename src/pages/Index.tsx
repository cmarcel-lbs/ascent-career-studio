import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { useVersionHistory } from "@/hooks/useVersionHistory";
import { AuthScreen } from "@/components/AuthScreen";
import { TrackWorkspace } from "@/components/TrackWorkspace";
import { TrackResults } from "@/components/TrackResults";
import { VersionHistoryPanel } from "@/components/VersionHistoryPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, LogOut, Briefcase, TrendingUp, Rocket, Box, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CAREER_TRACKS, type CareerTrack } from "@/types/application";
import type { GeneratedResults } from "@/types/application";
import { extractFileText } from "@/lib/extractFileText";

const TRACK_ICONS: Record<CareerTrack, React.ElementType> = {
  "investment-banking": Briefcase,
  "private-equity": TrendingUp,
  "venture-capital": Rocket,
  "product-management": Box,
  "growth-strategy": BarChart3,
};

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { state, activeTrack, activeState, setActiveTrack, updateTrack, resetTrack } = useWorkspaceState();
  const { versions, loading: versionsLoading, saveVersion, deleteVersion } = useVersionHistory();
  const [showHistory, setShowHistory] = useState(false);

  const handleGenerate = useCallback(async () => {
    const track = activeTrack;
    const ts = state.tracks[track];
    if (!ts.baseResume) return;

    updateTrack(track, { isProcessing: true });

    try {
      // --- Extract base resume text (PDF/DOCX/TXT aware) ---
      let resumeText: string;
      try {
        resumeText = await extractFileText(ts.baseResume);
      } catch (err) {
        throw new Error(`Resume extraction failed: ${err instanceof Error ? err.message : "Unknown error"}. Please try uploading a .txt version of your resume.`);
      }

      if (!resumeText || resumeText.length < 50) {
        throw new Error("Your resume file appears to be empty or unreadable. Please try a .txt or different .pdf export.");
      }

      // --- Extract text from supporting file materials (PDF/DOCX/TXT aware) ---
      const supportingTexts: string[] = [];
      for (const mat of ts.supportingMaterials) {
        if (mat.type === "file" && mat.file) {
          try {
            const text = await extractFileText(mat.file);
            if (text.trim()) supportingTexts.push(`[File: ${mat.label}]\n${text}`);
          } catch {
            // Non-critical — skip unreadable supporting files silently
          }
        } else if (mat.type === "link" && mat.url) {
          supportingTexts.push(`[Link: ${mat.url}]`);
        }
      }
      const supportingContext = supportingTexts.length > 0 ? supportingTexts.join("\n\n---\n\n") : "";

      // --- Extract text from reference files (PDF/DOCX/TXT aware) ---
      const referenceTexts: string[] = [];
      for (const ref of ts.references) {
        try {
          const text = await extractFileText(ref.file);
          if (text.trim()) referenceTexts.push(`[Reference (${ref.tag}): ${ref.file.name}]\n${text}`);
        } catch {
          // Non-critical — skip unreadable reference files silently
        }
      }
      const referencesText = referenceTexts.length > 0 ? referenceTexts.join("\n\n---\n\n") : "";

      const { data, error: fnError } = await supabase.functions.invoke("generate-application", {
        body: {
          careerTrack: track,
          jobDescription: ts.jobDescription,
          resumeText,
          additionalContext: ts.additionalContext || "",
          supportingContext,
          referencesText,
          referenceInfluence: ts.referenceInfluence,
          hasReferences: ts.references.length > 0,
        },
      });

      if (fnError) throw new Error(fnError.message || "Failed to generate");
      if (data?.error) throw new Error(data.error);

      updateTrack(track, { results: data, isProcessing: false });

      await saveVersion({
        careerTrack: track,
        jobDescription: ts.jobDescription,
        results: data,
        referenceInfluence: ts.referenceInfluence,
      });
    } catch (err) {
      console.error("Generation error:", err);
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
      updateTrack(track, { isProcessing: false });
    }
  }, [activeTrack, state.tracks, updateTrack, saveVersion]);

  const handleLoadVersion = (results: GeneratedResults) => {
    updateTrack(activeTrack, { results });
    setShowHistory(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-card/50 flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Career Studio</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {CAREER_TRACKS.map((t) => {
            const Icon = TRACK_ICONS[t.value];
            const isActive = activeTrack === t.value;
            const hasResults = !!state.tracks[t.value].results;
            return (
              <button
                key={t.value}
                onClick={() => setActiveTrack(t.value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{t.label}</span>
                {hasResults && (
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive ? "bg-primary-foreground/60" : "bg-accent"}`} />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowHistory(true)}
          >
            <Clock className="h-4 w-4" />
            History
            {versions.length > 0 && (
              <span className="ml-auto text-[10px] bg-accent text-accent-foreground rounded-full px-1.5 py-0.5 leading-none">
                {versions.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <ScrollArea className="h-screen">
          <div className="max-w-2xl mx-auto px-8 py-10">
            <motion.div
              key={activeTrack}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-1">
                  {CAREER_TRACKS.find((t) => t.value === activeTrack)?.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Upload your resume, paste the job description, and generate tailored application materials.
                </p>
              </div>

              {activeState.results ? (
                <TrackResults
                  results={activeState.results}
                  onReset={() => resetTrack(activeTrack)}
                  onRegenerate={handleGenerate}
                />
              ) : (
                <TrackWorkspace
                  trackState={activeState}
                  onUpdate={(patch) => updateTrack(activeTrack, patch)}
                  onGenerate={handleGenerate}
                />
              )}
            </motion.div>
          </div>
        </ScrollArea>
      </main>

      {/* Version History Panel */}
      <AnimatePresence>
        {showHistory && (
          <VersionHistoryPanel
            versions={versions}
            loading={versionsLoading}
            onLoadVersion={handleLoadVersion}
            onDelete={deleteVersion}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
