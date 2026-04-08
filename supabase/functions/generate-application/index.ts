import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CAREER_STYLES: Record<string, { tone: string; focus: string[]; styleRules?: string; coverLetterTone?: string }> = {
  "investment-banking": {
    tone: "extremely concise, high-signal, metrics-forward, and polished",
    focus: ["financial analysis", "valuation", "transaction support", "strategic analysis", "client-facing work", "executive presentations"],
    styleRules: `STYLE RULES:
- Extremely concise. High signal, low fluff.
- Direct and polished. Bullets should feel sharp, efficient, and achievement-oriented.
- Metrics-forward wherever supported by the resume.
- Emphasize transaction experience, finance, execution, and client exposure when relevant.
- Avoid long narrative phrasing, soft/vague language, and overly promotional tone.
- De-emphasize generic teamwork language, broad corporate jargon, excessive storytelling, and unsubstantiated leadership claims.

PRIORITIZE: Financial analysis, valuation, transaction support, strategic analysis, client-facing work, executive presentations, cross-functional execution in demanding environments, analytical rigor, evidence of ownership and precision.`,
    coverLetterTone: `COVER LETTER TONE:
- Highly tailored to the specific bank/team/role.
- Professional and deliberate. Motivated but restrained.
- Specific about why this bank, this team, this role.
- Focus on fit, preparation, and relevance. No generic enthusiasm.`,
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { careerTrack, jobDescription, resumeText, referenceInfluence, hasReferences } = await req.json();

    if (!careerTrack || !jobDescription || !resumeText) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: careerTrack, jobDescription, resumeText" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const style = CAREER_STYLES[careerTrack] || CAREER_STYLES["product-management"];
    const influenceLevel = referenceInfluence ?? 50;
    const refGuidance = hasReferences
      ? `The user has uploaded reference materials. Apply their writing style and structure at an influence level of ${influenceLevel}% (0=ignore, 100=heavily mirror style). Never copy content directly.`
      : "No reference materials were provided.";

    const systemPrompt = `You are an elite career application specialist. Your job is to TAILOR the user's existing resume and write a matching cover letter for a specific job description.

CAREER TRACK: ${careerTrack}
TONE: ${style.tone}
KEY FOCUS AREAS: ${style.focus.join(", ")}

${style.styleRules || ""}

CRITICAL RULES:
- You MUST use the user's actual resume as the foundation. Preserve their real experience, companies, job titles, dates, education, and achievements.
- NEVER invent companies, roles, degrees, metrics, or experiences that are not in the base resume.
- Rewrite bullet points to emphasize skills and keywords from the job description.
- Reorder sections and experiences to prioritize what's most relevant to the target role.
- Improve phrasing to be ${style.tone}, but the facts must come from the base resume.
- Quantify achievements where the base resume provides numbers; do not fabricate metrics.
- Optimize for both ATS systems and human readability.
- ${refGuidance}

${style.coverLetterTone || "The cover letter should reference specific experiences from the base resume that align with the job description."}

You must respond with valid JSON using this exact structure (no markdown, no code fences):
{
  "resume": "The full tailored resume text, based on the user's actual resume content",
  "coverLetter": "A cover letter referencing the user's real experience",
  "insights": {
    "matchScore": <number 0-100>,
    "missingKeywords": ["keyword1", "keyword2"],
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
    "changesSummary": ["change1", "change2", "change3"]
  }
}`;

    const userPrompt = `Here is the user's base resume — this contains their REAL experience. You must use this as the source of truth:
---
${resumeText}
---

Here is the job description they are applying to:
---
${jobDescription}
---

Tailor the resume above for this specific job. Restructure, reword, and reorder to maximize relevance, but keep all facts from the original resume. Then write a cover letter drawing on their real experience. Return ONLY valid JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("No content in AI response");
    }

    // Strip markdown code fences if present
    const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-application error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
