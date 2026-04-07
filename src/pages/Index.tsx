import { useCallback } from "react";
import { useApplicationState } from "@/hooks/useApplicationState";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { InputScreen } from "@/components/InputScreen";
import { ReferenceScreen } from "@/components/ReferenceScreen";
import { ProcessingScreen } from "@/components/ProcessingScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { generateMockResults } from "@/lib/generateResults";

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

  const handleProcessingComplete = useCallback(() => {
    if (!state.careerTrack || !state.baseResume) return;
    const results = generateMockResults(
      state.careerTrack,
      state.jobDescription,
      state.baseResume.name,
      state.references.length > 0
    );
    setResults(results);
    setStep(4);
  }, [state.careerTrack, state.baseResume, state.jobDescription, state.references, setResults, setStep]);

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
          onNext={nextStep}
          onSkip={nextStep}
          onBack={prevStep}
        />
      )}
      {state.step === 3 && <ProcessingScreen onComplete={handleProcessingComplete} />}
      {state.step === 4 && state.results && <ResultsScreen results={state.results} onReset={reset} />}
    </>
  );
};

export default Index;
