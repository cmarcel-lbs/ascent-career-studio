import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobTitle, jobDescription, profileSummary, skills, resumeContent } = await req.json();

    if (!jobDescription) {
      return new Response(
        JSON.stringify({ error: "Job description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a career match analyst. Analyze how well a candidate matches a job and provide a detailed, honest assessment. Be specific about strengths and gaps. Write in clear, professional prose.`;

    const userPrompt = `Analyze this candidate's fit for the following role:

JOB: ${jobTitle || "Role"}
JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
${profileSummary || "No profile summary provided."}

CANDIDATE SKILLS:
${skills?.length > 0 ? skills.join(", ") : "Not specified"}

CANDIDATE RESUME:
${resumeContent || "No resume content available."}

Provide a detailed match analysis covering:
1. Overall fit assessment (1-2 sentences)
2. Key strengths that align with this role
3. Gaps or missing qualifications
4. Which skills to emphasize in the application
5. Recommended approach for the cover letter
6. Any concerns or red flags

Be honest, specific, and actionable.`;

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
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const aiResponse = await response.json();
    const explanation = aiResponse.choices?.[0]?.message?.content || "No analysis available.";

    return new Response(
      JSON.stringify({ explanation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("match-jobs error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
