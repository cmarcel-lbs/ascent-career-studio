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
    tone: "analytical, selective, investor-minded, crisp, and commercially aware",
    focus: ["investing mindset", "deal exposure", "diligence", "financial analysis", "operational value creation", "business model assessment", "market and competitive analysis", "portfolio and strategic thinking"],
    styleRules: `STYLE RULES:
- Analytical, selective, and investor-minded. Crisp and commercially aware.
- Slightly more evaluative than investment banking — focus on judgment, diligence, value drivers, and business quality.
- Keep wording concise and mature.
- Avoid sounding like general corporate strategy unless the experience clearly points there.
- De-emphasize generic project management, high-level strategy language without commercial substance, and excessive enthusiasm or startup-style informality.

PRIORITIZE: Investing mindset, deal exposure, diligence, financial analysis, operational value creation, business model assessment, market and competitive analysis, portfolio or strategic thinking, evidence of strong judgment and pattern recognition.`,
    coverLetterTone: `COVER LETTER TONE:
- Focused, credible, selective.
- Show why the candidate can think like an investor.
- Emphasize analytical maturity and ability to assess businesses.
- No generic enthusiasm — demonstrate judgment and commercial awareness.`,
  },
  "venture-capital": {
    tone: "insightful, intellectually curious, commercially aware, and polished but not stiff",
    focus: ["startup ecosystems", "market mapping", "thesis-driven thinking", "research and diligence", "commercial insight", "product and market intuition", "investment memo reasoning", "founder-facing exposure"],
    styleRules: `STYLE RULES:
- Insightful, intellectually curious, and commercially aware.
- More narrative than IB or PE, but still polished and concise. The writing should feel thoughtful, not stiff.
- Highlight pattern recognition, market thinking, startup exposure, and investment judgment.
- Avoid sounding like generic consulting copy, overly formal banking tone, or empty buzzwords.
- De-emphasize generic "passionate about innovation" phrasing unless tied to real evidence.

PRIORITIZE: Startup ecosystems, market mapping, thesis-driven thinking, research and diligence, commercial insight, product and market intuition, investment memo style reasoning, founder-facing and ecosystem-facing exposure, evidence of curiosity and independent thinking.`,
    coverLetterTone: `COVER LETTER TONE:
- Specific, thoughtful, and informed.
- Show genuine interest in markets, startups, and investing.
- Convey judgment and curiosity, not just enthusiasm.
- Tie interest to real experiences or observations, not generic statements.`,
  },
  "product-management": {
    tone: "clear, structured, user-oriented, outcome-driven, and execution-focused",
    focus: ["product impact", "user problems", "roadmap and prioritization decisions", "cross-functional collaboration", "experimentation", "product launches", "stakeholder alignment", "data-informed decision making", "iteration and delivery"],
    styleRules: `STYLE RULES:
- Clear, structured, user-oriented, and outcome-driven.
- Emphasize ownership, decision-making, prioritization, and cross-functional collaboration.
- Highlight product outcomes over task lists. Use metrics and impact where possible.
- Make the candidate sound thoughtful, practical, and execution-oriented.
- De-emphasize overly finance-heavy or investment-heavy framing unless directly relevant, generic leadership wording, and abstract strategy with no user or business outcome.

PRIORITIZE: Product impact, user problems, roadmap or prioritization decisions, cross-functional collaboration, experimentation, product launches, stakeholder alignment, data-informed decision making, iteration and delivery.`,
    coverLetterTone: `COVER LETTER TONE:
- Practical, informed, and product-minded.
- Show why the candidate understands product work.
- Emphasize users, outcomes, and ownership.
- Tie claims to specific product decisions or results.`,
  },
  "growth-strategy": {
    tone: "analytical, commercially minded, structured, and execution-oriented",
    focus: ["growth initiatives", "GTM strategy", "market analysis", "revenue and funnel improvement", "experimentation", "cross-functional problem solving", "strategic planning", "KPI ownership", "business performance improvement"],
    styleRules: `STYLE RULES:
- Analytical, commercially minded, and structured.
- Blend strategic thinking with measurable execution.
- Highlight business impact, experimentation, GTM logic, and decision support.
- Keep language polished and direct. Avoid sounding purely academic or purely operational.
- De-emphasize generic operations language, purely tactical task descriptions, and vague strategy without measurable outcomes.

PRIORITIZE: Growth initiatives, GTM strategy, market analysis, revenue or funnel improvement, experimentation, cross-functional problem solving, strategic planning, KPI ownership, business performance improvement.`,
    coverLetterTone: `COVER LETTER TONE:
- Commercial, sharp, and pragmatic.
- Show structured thinking and measurable impact.
- Explain fit through business judgment and execution ability.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { careerTrack, jobDescription, resumeText, additionalContext, supportingContext, referenceInfluence, hasReferences } = await req.json();

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

    const systemPrompt = `You are an elite career application specialist. Your ONLY job is to REWRITE and TAILOR the user's existing resume content for a specific job description. You are NOT writing a new resume from scratch. You are editing THEIR resume.

CAREER TRACK: ${careerTrack}
TONE: ${style.tone}
KEY FOCUS AREAS: ${style.focus.join(", ")}

${style.styleRules || ""}

ABSOLUTE GROUNDING RULES — VIOLATIONS ARE UNACCEPTABLE:

The BASE RESUME (and the optional ADDITIONAL CONTEXT section) are the ONLY permitted sources of factual claims. Every single fact in your output must trace back to one of these two sources. If it does not, remove it.

You must NEVER invent, fabricate, embellish, or infer ANY of the following:
- Employers, company names, or organizations not in the base resume or additional context
- Job titles or roles not in the base resume or additional context
- Bullet points describing work the candidate did not describe
- Transactions, deals, or engagements not mentioned by the candidate
- Metrics, numbers, dollar amounts, percentages, or quantities not explicitly stated
- Tools, software, platforms, or technologies not listed by the candidate
- Client names or client types not mentioned
- Skills or competencies the candidate did not claim
- Outcomes, results, or achievements not supported by the source material
- Certifications, degrees, coursework, or credentials not listed
- Dates, durations, or timelines not provided

WHAT YOU MAY DO:
- Reword and rephrase existing bullet points to align with JD keywords and the career track tone
- Reorder sections and experiences to prioritize relevance to the target role
- Combine or split existing bullets for clarity, as long as no new facts are introduced
- Add JD-relevant keywords as descriptors ONLY when the underlying experience genuinely supports them
- Remove or de-emphasize experiences that are irrelevant to the target role
- Improve grammar, conciseness, and professional polish

WHAT THE JOB DESCRIPTION IS FOR:
- Guiding which experiences to emphasize or de-emphasize
- Informing keyword alignment and phrasing
- It is NOT a source of candidate facts — never transfer JD requirements into the resume as if the candidate has done them

WHAT REFERENCE FILES ARE FOR:
- ${refGuidance}
- References guide tone, structure, formatting, and style ONLY
- They are NOT a source of candidate facts

${style.coverLetterTone || "The cover letter should reference specific experiences from the base resume that align with the job description."}

COVER LETTER GROUNDING:
- Every claim in the cover letter must be traceable to the base resume or additional context
- Do not attribute experiences, skills, or achievements the candidate has not described
- It is acceptable to express enthusiasm and fit, but specific claims must be grounded

APPLICATION EMAIL:
You must also write a short, professional application email the candidate can use to submit their materials. If the job description or supporting materials include specific application instructions (e.g. email subject line, required attachments, who to address), follow them precisely. Otherwise, write a concise email suitable for sending a resume and cover letter to a recruiter or hiring manager.

SECOND-PASS VALIDATION (YOU MUST PERFORM THIS BEFORE RESPONDING):
After drafting the resume, cover letter, and email, review every line of your output against the base resume and additional context. For each factual claim ask: "Is this explicitly stated or directly supported by the source material?" If the answer is no, REMOVE or REWRITE the claim. This includes:
- Implied metrics (e.g., turning "helped with analysis" into "$50M+ analysis")
- Assumed tools or technologies
- Inferred job responsibilities not described by the candidate
- Fabricated outcomes or results

You must respond with valid JSON using this exact structure (no markdown, no code fences):
{
  "resume": "The full tailored resume text, grounded entirely in the base resume and additional context",
  "coverLetter": "A cover letter referencing only the candidate's real, documented experience",
  "applicationEmail": "A short email to accompany the application submission, following any JD instructions",
  "insights": {
    "matchScore": <number 0-100>,
    "missingKeywords": ["keyword1", "keyword2"],
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
    "changesSummary": ["change1", "change2", "change3"]
  }
}`;

    const supportingSection = supportingContext
      ? `\n\nThe following supporting materials provide additional context about the role, company, or team. Use this ONLY to better understand the position and tailor the application — NOT as a source of candidate facts:\n---\n${supportingContext}\n---`
      : "";

    const additionalSection = additionalContext?.trim()
      ? `\n\nADDITIONAL CONTEXT (off-resume experiences the candidate has confirmed are real). You MAY incorporate these if relevant to the target role. These are a permitted source of facts alongside the base resume:\n---\n${additionalContext.trim()}\n---`
      : "";

    const userPrompt = `Here is the user's BASE RESUME — this is the primary source of truth for all factual claims. Every employer, title, bullet, metric, tool, skill, and credential in your output must come from this document (or the additional context section if provided):
---
${resumeText}
---

Here is the JOB DESCRIPTION the candidate is applying to. Use this ONLY for tailoring emphasis, keyword alignment, and understanding what the role requires — NOT as a source of candidate facts:
---
${jobDescription}
---${supportingSection}${additionalSection}

IMPORTANT REMINDER: You are EDITING the resume above — not writing a new one. The output resume must contain ONLY employers, titles, dates, bullets, metrics, and skills that appear in the base resume or additional context above. If a fact does not appear in those sections, it MUST NOT appear in your output. Do not generate placeholder company names like "[Company]" or "[University]" — use the ACTUAL names from the resume. Perform the second-pass validation before responding. Return ONLY valid JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
