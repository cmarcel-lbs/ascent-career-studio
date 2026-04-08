import type { CareerTrack, ReferenceFile, GeneratedResults } from "@/types/application";

export interface SupportingMaterial {
  id: string;
  type: "file" | "link";
  file?: File;
  url?: string;
  label: string;
}

export interface TrackState {
  baseResume: File | null;
  jobDescription: string;
  additionalContext: string;
  supportingMaterials: SupportingMaterial[];
  references: ReferenceFile[];
  referenceInfluence: number;
  results: GeneratedResults | null;
  isProcessing: boolean;
}

export interface WorkspaceState {
  activeTrack: CareerTrack;
  tracks: Record<CareerTrack, TrackState>;
}

export const TRACK_LIST: CareerTrack[] = [
  "investment-banking",
  "private-equity",
  "venture-capital",
  "product-management",
  "growth-strategy",
];

export function createEmptyTrackState(): TrackState {
  return {
    baseResume: null,
    jobDescription: "",
    additionalContext: "",
    supportingMaterials: [],
    references: [],
    referenceInfluence: 50,
    results: null,
    isProcessing: false,
  };
}

export function createInitialWorkspace(): WorkspaceState {
  const tracks = {} as Record<CareerTrack, TrackState>;
  for (const t of TRACK_LIST) {
    tracks[t] = createEmptyTrackState();
  }
  return { activeTrack: "investment-banking", tracks };
}
