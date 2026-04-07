export type CareerTrack =
  | "investment-banking"
  | "private-equity"
  | "venture-capital"
  | "product-management"
  | "growth-strategy";

export const CAREER_TRACKS: { value: CareerTrack; label: string }[] = [
  { value: "investment-banking", label: "Investment Banking" },
  { value: "private-equity", label: "Private Equity" },
  { value: "venture-capital", label: "Venture Capital" },
  { value: "product-management", label: "Product Management" },
  { value: "growth-strategy", label: "Growth & Strategy" },
];

export type ReferenceTag = "strong-resume" | "strong-cover-letter" | "general-reference";

export interface ReferenceFile {
  id: string;
  file: File;
  tag: ReferenceTag;
}

export interface ApplicationState {
  step: number;
  careerTrack: CareerTrack | null;
  baseResume: File | null;
  jobDescription: string;
  references: ReferenceFile[];
  referenceInfluence: number; // 0-100
  results: GeneratedResults | null;
}

export interface GeneratedResults {
  resume: string;
  coverLetter: string;
  insights: {
    matchScore: number;
    missingKeywords: string[];
    suggestions: string[];
    changesSummary: string[];
  };
}
