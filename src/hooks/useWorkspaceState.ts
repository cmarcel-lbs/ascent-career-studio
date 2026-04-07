import { useState, useCallback } from "react";
import type { CareerTrack, ReferenceFile, GeneratedResults } from "@/types/application";
import { createInitialWorkspace, type TrackState, type WorkspaceState } from "@/types/workspace";

export function useWorkspaceState() {
  const [state, setState] = useState<WorkspaceState>(createInitialWorkspace);

  const setActiveTrack = useCallback((track: CareerTrack) => {
    setState((s) => ({ ...s, activeTrack: track }));
  }, []);

  const updateTrack = useCallback((track: CareerTrack, patch: Partial<TrackState>) => {
    setState((s) => ({
      ...s,
      tracks: { ...s.tracks, [track]: { ...s.tracks[track], ...patch } },
    }));
  }, []);

  const activeState = state.tracks[state.activeTrack];

  return {
    state,
    activeTrack: state.activeTrack,
    activeState,
    setActiveTrack,
    updateTrack,
    resetTrack: useCallback((track: CareerTrack) => {
      updateTrack(track, {
        baseResume: null,
        jobDescription: "",
        references: [],
        referenceInfluence: 50,
        results: null,
        isProcessing: false,
      });
    }, [updateTrack]),
  };
}
