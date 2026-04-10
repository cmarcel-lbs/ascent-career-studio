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
    const { careerTrack, jobDescription, resumeText, additionalContext, supportingContext, referencesText, referenceInfluence, hasReferences } = await req.json();

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
    const refGuidance = hasReferences && referencesText
      ? `The user has uploaded reference materials (shown below). Apply their writing style and structure at an influence level of ${influenceLevel}% (0=ignore, 100=heavily mirror style). Use them ONLY to guide tone, formatting, and style — NEVER copy their factual content.`
      : hasReferences
      ? `The user has uploaded reference materials. Apply their writing style and structure at an influence level of ${influenceLevel}% (0=ignore, 100=heavily mirror style). Never copy content directly.`
      : "No reference materials were provided.";

    const systemPrompt = `You are an elite resume strategist and career coach. Your job is to produce an aggressively optimised, job-winning version of the candidate\'s resume — not a light polish. The candidate expects meaningful, substantive improvements, not a copy of what they submitted.

════════════════════════════════
PART 1: WHAT YOU MUST DO — AGGRESSIVELY
════════════════════════════════

REWRITE BULLETS FOR MAXIMUM IMPACT:
- Every bullet point should be rewritten to be as strong, specific, and JD-aligned as possible.
- Lead every bullet with a powerful action verb. NEVER start with "Responsible for", "Helped", "Assisted", or "Worked on".
- Transform vague passive descriptions into active, outcome-oriented statements.
- Where the candidate mentions an activity, frame it around the business outcome (e.g. "conducted analysis" → "Delivered [type] analysis informing [decision type]" — using only what the resume states).
- Tighten every bullet to one punchy sentence. Cut filler mercilessly.

KEYWORD AND ATS OPTIMISATION:
- Extract the most important keywords, skills, and phrases from the job description.
- Weave these keywords naturally into the resume wherever the candidate\'s experience genuinely supports them — even if the original used different terminology.
- Mirror the exact language and phrasing from the JD where truthful — ATS systems do literal string matching.
- If no Skills section exists, ADD one — populated only from skills the candidate demonstrably has based on their experience.

STRUCTURAL OPTIMISATION FOR HUMAN READABILITY:
- Reorder bullets within each role so the most JD-relevant achievements appear first.
- If the resume has a Professional Summary, rewrite it entirely: a sharp 2–3 line pitch tailored to this exact role.
- If NO summary exists, ADD one at the top — 2–3 targeted sentences drawn from the candidate\'s real experience.
- Remove or heavily trim bullets irrelevant to the target role — white space is better than weak content.
- Ensure consistent formatting: parallel bullet structure, consistent date format, clean alignment.
- Reorder roles or sections if doing so meaningfully improves relevance signalling.

CAREER TRACK OPTIMISATION:
TRACK: \${careerTrack}
TONE: \${style.tone}
PRIORITISE: \${style.focus.join(", ")}

\${style.styleRules || ""}

ADDITIONAL CONTEXT INTEGRATION:
- If the candidate provided Additional Context (experiences, projects, skills not yet on their resume), ACTIVELY incorporate the most relevant into the resume.
- Treat additional context as real, confirmed experience. Weave it into existing roles or add a new section if needed.

════════════════════════════════
PART 2: THE ONE RULE YOU MUST NOT BREAK
════════════════════════════════

YOU MAY REWRITE ANYTHING. YOU MAY NOT INVENT FACTS.

Every factual claim in your output must trace to the base resume or additional context. You must NEVER fabricate:
- Employers, company names, or job titles not in the source material
- Metrics, numbers, or percentages the candidate did not state
- Tools, technologies, or platforms not mentioned by the candidate
- Deals, clients, transactions, or projects not described
- Credentials or certifications not listed

The JD tells you WHAT to emphasise and HOW to phrase things. It does not give you new facts about the candidate.

If a bullet is vague, make it stronger using only what was stated. "Worked on financial models" → "Built financial models supporting strategic planning" ✓. "Built financial models for a $500M deal" ✗ (fabricated metric).

════════════════════════════════
PART 3: COVER LETTER
════════════════════════════════

\${style.coverLetterTone || "Write a compelling, specific cover letter connecting the candidate\'s real experience to the role."}

- Open with a confident hook — NOT "I am writing to express my interest."
- Reference 2–3 specific, real achievements that directly answer the JD\'s needs.
- Show genuine understanding of what the role/firm/team is looking for.
- Close with a clear, confident call to action.
- Every claim must be grounded in the base resume or additional context.
- Length: 3–4 paragraphs, no filler.

APPLICATION EMAIL:
Write a short professional email (3–4 sentences) to submit the application. Follow any JD instructions for subject line or recipient. Otherwise write a clean, direct email to a recruiter or hiring manager.

════════════════════════════════
PART 4: REFERENCE MATERIALS
════════════════════════════════

\${refGuidance}
Reference materials guide tone, structure, and style only — never facts.

════════════════════════════════
OUTPUT — VALID JSON ONLY
════════════════════════════════

No markdown, no code fences, no text outside the JSON object:
{
  "resume": "The full optimised resume — substantively rewritten, ATS-tuned, and tailored to the JD. Should read noticeably stronger than the original.",
  "coverLetter": "A compelling, specific cover letter grounded in the candidate\'s real experience.",
  "applicationEmail": "A short professional email to submit the application.",
  "insights": {
    "matchScore": <number 0-100 reflecting genuine fit after optimisation>,
    "missingKeywords": ["JD keywords that could NOT be honestly added because the candidate lacks the underlying experience — be specific"],
    "suggestions": ["3–5 concrete, actionable things the candidate could do to strengthen their profile for this role — training, certifications, projects, etc."],
    "changesSummary": ["5–7 specific changes made to the resume and why — be concrete, e.g. \'Rewrote 4 bullets in [Role] to lead with outcomes and mirror JD language around [topic]\'"]
  }
}`;

    const supportingSection = supportingContext
      ? `\n\nThe following supporting materials provide additional context about the role, company, or team. Use this ONLY to better understand the position and tailor the application — NOT as a source of candidate facts:\n---\n${supportingContext}\n---`
      : "";

    const additionalSection = additionalContext?.trim()
      ? `\n\nADDITIONAL CONTEXT (off-resume experiences the candidate has confirmed are real). You MAY incorporate these if relevant to the target role. These are a permitted source of facts alongside the base resume:\n---\n${additionalContext.trim()}\n---`
      : "";

    const referencesSection = referencesText?.trim()
      ? `\n\nREFERENCE MATERIALS (for style/tone/formatting guidance ONLY — NOT a source of candidate facts):\n---\n${referencesText.trim()}\n---`
      : "";

    const userPrompt = `Here is the user's BASE RESUME — this is the primary source of truth for all factual claims. Every employer, title, bullet, metric, tool, skill, and credential in your output must come from this document (or the additional context section if provided):
---
${resumeText}
---

Here is the JOB DESCRIPTION the candidate is applying to. Use this ONLY for tailoring emphasis, keyword alignment, and understanding what the role requires — NOT as a source of candidate facts:
---
${jobDescription}
---${supportingSection}${additionalSection}

IMPORTANT REMINDER: You are EDITING the resume above — not writing a new one. The output resume must contain ONLY employers, titles, dates, bullets, metrics, and skills that appear in the base resume or additional context above. If a fact does not appear in those sections, it MUST NOT appear in your output. Do not generate placeholder company names like "[Company]" or "[University]" — use the ACTUAL names from the resume. Perform the second-pass validation before responding. Return ONLY valid JSON.${referencesSection}`;

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
