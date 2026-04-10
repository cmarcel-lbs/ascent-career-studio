import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const { query, profileSummary, skills, preferredTracks } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Search query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const trackList = (preferredTracks?.length > 0 ? preferredTracks : [
      "investment-banking", "private-equity", "venture-capital", "product-management", "growth-strategy"
    ]).join(", ");

    const systemPrompt = `You are a career job search assistant. Given a search query, generate realistic, relevant job listings that match the query. Each job should be a plausible real-world opening.

CAREER TRACKS: ${trackList}

For each job, classify it into exactly one career track based on the role's responsibilities, not just the title.

USER PROFILE:
${profileSummary ? `Summary: ${profileSummary}` : "No profile summary provided."}
${skills?.length > 0 ? `Skills: ${skills.join(", ")}` : ""}

Return a JSON array of job objects. Each object must have:
- title (string)
- company (string - use real, well-known companies)
- description (string - 3-5 paragraphs of realistic job description)
- location (string)
- source (string - e.g. "LinkedIn", "Company Website", "Indeed")
- source_url (string - empty string)
- career_track (string - one of: investment-banking, private-equity, venture-capital, product-management, growth-strategy)
- seniority (string - e.g. "Analyst", "Associate", "VP", "Director", "Senior")
- work_mode (string - one of: remote, hybrid, onsite)
- salary_range (string - e.g. "$120,000 - $150,000")
- keywords (string array - 5-10 relevant keywords)

Generate 5-8 diverse, realistic jobs. Return ONLY valid JSON array, no markdown.`;

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
          { role: "user", content: `Search query: "${query}"` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("No content from AI");

    const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const jobsArray = JSON.parse(cleaned);

    if (!Array.isArray(jobsArray)) throw new Error("AI did not return an array");

    // Insert jobs into database
    const jobsToInsert = jobsArray.map((j: any) => ({
      title: j.title || "Untitled",
      company: j.company || "Unknown",
      description: j.description || "",
      location: j.location || "",
      source: j.source || "AI Search",
      source_url: j.source_url || "",
      career_track: j.career_track || "product-management",
      seniority: j.seniority || "",
      work_mode: j.work_mode || "onsite",
      salary_range: j.salary_range || "",
      keywords: j.keywords || [],
    }));

    const { error: insertError } = await supabase.from("jobs").insert(jobsToInsert);
    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save jobs");
    }

    return new Response(
      JSON.stringify({ success: true, jobsAdded: jobsToInsert.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("search-jobs error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
