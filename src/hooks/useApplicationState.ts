import { useState, useCallback } from "react";
import type { ApplicationState, CareerTrack, ReferenceFile, GeneratedResults } from "@/types/application";

const initialState: ApplicationState = {
  step: 0,
  careerTrack: null,
  baseResume: null,
  jobDescription: "",
  references: [],
  results: null,
};

export function useApplicationState() {
  const [state, setState] = useState<ApplicationState>(initialState);

  const setStep = useCallback((step: number) => setState((s) => ({ ...s, step })), []);
  const setCareerTrack = useCallback((careerTrack: CareerTrack) => setState((s) => ({ ...s, careerTrack })), []);
  const setBaseResume = useCallback((baseResume: File | null) => setState((s) => ({ ...s, baseResume })), []);
  const setJobDescription = useCallback((jobDescription: string) => setState((s) => ({ ...s, jobDescription })), []);
  const setReferences = useCallback((references: ReferenceFile[]) => setState((s) => ({ ...s, references })), []);
  const setResults = useCallback((results: GeneratedResults) => setState((s) => ({ ...s, results })), []);

  const nextStep = useCallback(() => setState((s) => ({ ...s, step: s.step + 1 })), []);
  const prevStep = useCallback(() => setState((s) => ({ ...s, step: Math.max(0, s.step - 1) })), []);

  const reset = useCallback(() => setState(initialState), []);

  return {
    state,
    setStep,
    setCareerTrack,
    setBaseResume,
    setJobDescription,
    setReferences,
    setResults,
    nextStep,
    prevStep,
    reset,
  };
}
