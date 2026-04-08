import type { CareerTrack, GeneratedResults } from "@/types/application";

const CAREER_STYLES: Record<CareerTrack, { tone: string; focus: string[] }> = {
  "investment-banking": {
    tone: "concise, technical, and metrics-driven",
    focus: ["deal experience", "financial modeling", "valuation", "transaction advisory"],
  },
  "private-equity": {
    tone: "analytical, investor-minded, and deal-focused",
    focus: ["portfolio management", "due diligence", "value creation", "LBO modeling"],
  },
  "venture-capital": {
    tone: "market-aware, thoughtful, and startup-oriented",
    focus: ["market analysis", "founder evaluation", "sector thesis", "portfolio support"],
  },
  "product-management": {
    tone: "user-focused, impact-driven, and cross-functional",
    focus: ["product strategy", "user research", "roadmap planning", "stakeholder alignment"],
  },
  "growth-strategy": {
    tone: "analytics-driven, GTM-focused, and business-impact oriented",
    focus: ["growth analytics", "market expansion", "conversion optimization", "strategic planning"],
  },
};

export function generateMockResults(
  careerTrack: CareerTrack,
  jobDescription: string,
  resumeFileName: string,
  hasReferences: boolean
): GeneratedResults {
  const style = CAREER_STYLES[careerTrack];
  const keywords = extractKeywords(jobDescription);
  const matchedKeywords = keywords.slice(0, Math.floor(keywords.length * 0.7));
  const missingKeywords = keywords.slice(Math.floor(keywords.length * 0.7));

  const resume = `PROFESSIONAL SUMMARY
Results-oriented professional with demonstrated expertise in ${style.focus.slice(0, 2).join(" and ")}. Track record of delivering measurable business impact through ${style.tone.split(",")[0]} approach to problem-solving and execution.

EXPERIENCE

Senior Associate — [Current Company]
January 2022 – Present
• Led cross-functional initiatives resulting in 35% improvement in key performance metrics
• Developed and executed ${style.focus[0]} frameworks adopted across the organization
• Managed stakeholder relationships with C-suite executives and external partners
• Spearheaded ${style.focus[1]} projects generating $2.4M in incremental value

Associate — [Previous Company]
June 2019 – December 2021
• Built comprehensive ${style.focus[2]} models supporting strategic decision-making
• Analyzed market data across 15+ segments to identify growth opportunities
• Collaborated with engineering and design teams to deliver 3 major product launches
• Created automated reporting dashboards reducing manual effort by 60%

Analyst — [Earlier Company]
August 2017 – May 2019
• Conducted ${style.focus[3]} research informing $50M+ investment decisions
• Prepared executive presentations for quarterly business reviews
• Developed financial models and scenario analyses for strategic planning

EDUCATION

MBA — [Top Business School], 2022
B.S. in Economics — [University], 2017

SKILLS
${matchedKeywords.join(" • ")}`;

  const coverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in this position, which represents an exceptional alignment with my background in ${style.focus[0]} and ${style.focus[1]}.

Throughout my career, I have consistently demonstrated a ${style.tone} approach to driving results. At my current role, I have led initiatives that directly mirror the responsibilities outlined in this position, including ${style.focus.slice(0, 3).join(", ")}.

What particularly excites me about this opportunity is the chance to apply my expertise in ${style.focus[2]} within an organization that values ${style.focus[3]}. My experience has equipped me with both the technical rigor and strategic perspective needed to excel in this role.

${hasReferences ? "Drawing on the structured communication style reflected in my previous applications, " : ""}I am confident that my combination of analytical depth and collaborative leadership would make me a strong contributor to your team from day one.

I would welcome the opportunity to discuss how my background aligns with your needs. Thank you for your consideration.

Sincerely,
[Your Name]`;

  const matchScore = 72 + Math.floor(Math.random() * 18);

  return {
    resume,
    coverLetter,
    applicationEmail: "",
    insights: {
      matchScore,
      missingKeywords: missingKeywords.length > 0 ? missingKeywords : ["leadership development", "stakeholder management"],
      suggestions: [
        `Quantify more achievements with specific metrics relevant to ${style.focus[0]}`,
        `Add examples demonstrating ${style.focus[1]} expertise`,
        `Include industry-specific terminology: ${missingKeywords.slice(0, 2).join(", ") || style.focus[3]}`,
        "Consider adding relevant certifications or technical skills",
        `Strengthen the narrative around ${style.focus[2]} experience`,
      ],
      changesSummary: [
        `Reframed experience using ${style.tone} language`,
        `Emphasized ${style.focus[0]} and ${style.focus[1]} competencies`,
        `Aligned keywords with job description requirements`,
        `Restructured bullet points for ATS optimization`,
        hasReferences ? "Incorporated stylistic patterns from reference materials" : "Applied standard formatting best practices",
      ],
    },
  };
}

function extractKeywords(text: string): string[] {
  const common = new Set(["the", "and", "for", "with", "our", "you", "will", "are", "this", "that", "from", "have", "been", "can", "has", "your", "all", "was", "but", "not", "they", "their", "about", "would", "more", "into", "also", "than", "other"]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !common.has(w));

  const freq: Record<string, number> = {};
  words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([w]) => w);
}
