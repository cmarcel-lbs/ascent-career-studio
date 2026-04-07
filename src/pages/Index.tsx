import { useCallback, useState } from "react";
import { useApplicationState } from "@/hooks/useApplicationState";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { InputScreen } from "@/components/InputScreen";
import { ReferenceScreen } from "@/components/ReferenceScreen";
import { ProcessingScreen } from "@/components/ProcessingScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const {
    state,
    setStep,
    setCareerTrack,
    setBaseResume,
    setJobDescription,
    setReferences,
    setReferenceInfluence,
    setResults,
    nextStep,
    prevStep,
    reset,
  } = useApplicationState();

  const [error, setError] = useState<string | null>(null);

  const handleStartProcessing = useCallback(async () => {
    if (!state.careerTrack || !state.baseResume) return;

    setStep(3);
    setError(null);

    try {
      // Read resume file as text
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

      if (fnError) {
        throw new Error(fnError.message || "Failed to generate application materials");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResults(data);
      setStep(4);
    } catch (err) {
      console.error("Generation error:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(message);
      setError(message);
      setStep(2); // go back to references screen
    }
  }, [state.careerTrack, state.baseResume, state.jobDescription, state.referenceInfluence, state.references, setResults, setStep]);

  return (
    <>
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
    </>
  );
};

export default Index;
