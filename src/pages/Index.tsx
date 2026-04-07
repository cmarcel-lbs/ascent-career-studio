import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useApplicationState } from "@/hooks/useApplicationState";
import { useAuth } from "@/hooks/useAuth";
import { useVersionHistory } from "@/hooks/useVersionHistory";
import { AuthScreen } from "@/components/AuthScreen";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { InputScreen } from "@/components/InputScreen";
import { ReferenceScreen } from "@/components/ReferenceScreen";
import { ProcessingScreen } from "@/components/ProcessingScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { VersionHistoryPanel } from "@/components/VersionHistoryPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeneratedResults } from "@/types/application";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    state, setStep, setCareerTrack, setBaseResume, setJobDescription,
    setReferences, setReferenceInfluence, setResults, nextStep, prevStep, reset,
  } = useApplicationState();

  const { versions, loading: versionsLoading, saveVersion, deleteVersion } = useVersionHistory();
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleStartProcessing = useCallback(async () => {
    if (!state.careerTrack || !state.baseResume) return;
    setStep(3);
    setError(null);

    try {
      const resumeText = await state.baseResume.text();
      const { data, error: fnError } = await supabase.functions.invoke("generate-application", {
        body: {
          careerTrack: state.careerTrack,
          jobDescription: state.jobDescription,
          resumeText,
          referenceInfluence: state.referenceInfluence,
          hasReferences: state.references.length > 0,
        },
      });

      if (fnError) throw new Error(fnError.message || "Failed to generate application materials");
      if (data?.error) throw new Error(data.error);

      setResults(data);
      setStep(4);

      // Auto-save version
      await saveVersion({
        careerTrack: state.careerTrack,
        jobDescription: state.jobDescription,
        results: data,
        referenceInfluence: state.referenceInfluence,
      });
    } catch (err) {
      console.error("Generation error:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(message);
      setError(message);
      setStep(2);
    }
  }, [state.careerTrack, state.baseResume, state.jobDescription, state.referenceInfluence, state.references, setResults, setStep, saveVersion]);

  const handleLoadVersion = (results: GeneratedResults) => {
    setResults(results);
    setStep(4);
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
    <>
      {/* Top bar */}
      <div className="fixed top-0 right-0 z-40 flex items-center gap-2 p-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-border text-muted-foreground hover:text-foreground"
          onClick={() => setShowHistory(true)}
        >
          <Clock className="h-3.5 w-3.5" />
          History
          {versions.length > 0 && (
            <span className="ml-1 text-xs bg-accent text-accent-foreground rounded-full px-1.5 py-0.5 leading-none">
              {versions.length}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>

      {state.step === 0 && <WelcomeScreen onStart={nextStep} />}
      {state.step === 1 && (
        <InputScreen
          careerTrack={state.careerTrack}
          baseResume={state.baseResume}
          jobDescription={state.jobDescription}
          onCareerTrackChange={setCareerTrack}
          onResumeChange={setBaseResume}
          onJobDescriptionChange={setJobDescription}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {state.step === 2 && (
        <ReferenceScreen
          references={state.references}
          referenceInfluence={state.referenceInfluence}
          onReferencesChange={setReferences}
          onReferenceInfluenceChange={setReferenceInfluence}
          onNext={handleStartProcessing}
          onSkip={handleStartProcessing}
          onBack={prevStep}
        />
      )}
      {state.step === 3 && <ProcessingScreen />}
      {state.step === 4 && state.results && <ResultsScreen results={state.results} onReset={reset} />}

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
    </>
  );
};

export default Index;
