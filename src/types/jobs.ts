import type { CareerTrack } from "./application";

export type WorkMode = "remote" | "hybrid" | "onsite";
export type JobStatus = "saved" | "hidden";
export type ApplicationStatus = "interested" | "applying" | "applied" | "interviewing" | "offer" | "rejected";

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  source: string;
  source_url: string;
  career_track: CareerTrack;
  seniority: string;
  work_mode: WorkMode;
  posted_date: string;
  salary_range: string;
  keywords: string[];
  created_at: string;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  status: JobStatus;
  created_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  tailored_resume: string;
  tailored_cover_letter: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MatchResult {
  score: number;
  summary: string;
  gaps: string[];
  bestResume: string | null;
}

export interface JobWithMatch extends Job {
  match?: MatchResult;
  savedStatus?: JobStatus | null;
  applicationStatus?: ApplicationStatus | null;
}

export interface JobFilters {
  careerTrack: CareerTrack | "all";
  location: string;
  source: string;
  workMode: WorkMode | "all";
  seniority: string;
  minMatchScore: number;
  datePosted: "any" | "day" | "week" | "month";
}

export const DEFAULT_FILTERS: JobFilters = {
  careerTrack: "all",
  location: "",
  source: "",
  workMode: "all",
  seniority: "",
  minMatchScore: 0,
  datePosted: "any",
};
