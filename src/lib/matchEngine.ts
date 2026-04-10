import type { Job } from "@/types/jobs";
import type { UserProfile, StoredResume } from "@/types/profile";
import type { MatchResult } from "@/types/jobs";

/**
 * Client-side heuristic matching engine.
 * Scores jobs based on keyword overlap, title similarity,
 * seniority fit, location preference, and career-track fit.
 */
export function scoreJob(
  job: Job,
  profile: UserProfile | null,
  resumes: StoredResume[]
): MatchResult {
  // If user has no profile or resumes, return a neutral placeholder
  const hasProfileSignal = (profile?.hard_skills?.length ?? 0) > 0 ||
    (profile?.preferred_career_tracks?.length ?? 0) > 0 ||
    resumes.length > 0;

  if (!hasProfileSignal) {
    return { score: 0, summary: "Complete your Profile and upload a Resume to see your match score.", gaps: [], bestResume: null };
  }

  let score = 30; // baseline — meaningful signal required to rise above this
  const gaps: string[] = [];
  const reasons: string[] = [];

  // Combine all resume content for keyword matching
  const allResumeText = resumes.map((r) => r.content).join(" ").toLowerCase();
  const profileSkills = (profile?.hard_skills || []).map((s) => s.toLowerCase());
  const combinedText = `${allResumeText} ${profileSkills.join(" ")}`;

  // 1. Keyword overlap (up to +25)
  const jobKeywords = job.keywords.length > 0 ? job.keywords : extractKeywords(job.description);
  const matchedKeywords = jobKeywords.filter((kw) => combinedText.includes(kw.toLowerCase()));
  const keywordRatio = jobKeywords.length > 0 ? matchedKeywords.length / jobKeywords.length : 0;
  score += Math.round(keywordRatio * 25);
  if (keywordRatio < 0.5 && jobKeywords.length > 0) {
    const missing = jobKeywords.filter((kw) => !combinedText.includes(kw.toLowerCase()));
    gaps.push(`Missing keywords: ${missing.slice(0, 5).join(", ")}`);
  }
  if (keywordRatio > 0.5) reasons.push("Strong keyword alignment with your resume");

  // 2. Career track fit (+10)
  if (profile?.preferred_career_tracks?.includes(job.career_track)) {
    score += 10;
    reasons.push("Matches your preferred career track");
  }

  // 3. Location preference (+5)
  if (profile?.target_locations?.length) {
    const locationMatch = profile.target_locations.some(
      (loc) => job.location.toLowerCase().includes(loc.toLowerCase())
    );
    if (locationMatch) {
      score += 5;
      reasons.push("Location matches your preferences");
    } else {
      gaps.push("Location does not match your preferences");
    }
  }

  // 4. Seniority fit (+5)
  if (profile?.target_seniority?.length && job.seniority) {
    const seniorityMatch = profile.target_seniority.some(
      (s) => job.seniority.toLowerCase().includes(s.toLowerCase())
    );
    if (seniorityMatch) {
      score += 5;
    } else {
      gaps.push(`Seniority level (${job.seniority}) may not match your target`);
    }
  }

  // 5. Industry relevance (+5)
  if (profile?.target_industries?.length) {
    const descLower = job.description.toLowerCase();
    const industryMatch = profile.target_industries.some((ind) => descLower.includes(ind.toLowerCase()));
    if (industryMatch) {
      score += 5;
      reasons.push("Industry aligns with your targets");
    }
  }

  // Determine best resume
  const trackResume = resumes.find((r) => r.career_track === job.career_track);
  const masterResume = resumes.find((r) => r.is_master);
  const bestResume = trackResume?.file_name || masterResume?.file_name || null;

  score = Math.min(100, Math.max(0, score));

  const summary = reasons.length > 0
    ? reasons.slice(0, 3).join(". ") + "."
    : "Limited information available for matching.";

  return { score, summary, gaps, bestResume };
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "by", "from", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
    "may", "might", "must", "shall", "can", "that", "this", "these", "those",
    "it", "its", "we", "our", "you", "your", "they", "their", "them", "as",
    "not", "no", "if", "than", "so", "very", "just", "about", "also", "into",
    "such", "other", "more", "some", "all", "any", "each", "every", "both",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const freq: Record<string, number> = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}
