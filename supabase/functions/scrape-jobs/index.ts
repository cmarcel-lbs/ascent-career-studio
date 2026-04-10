import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, source, preferredTracks } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "A valid URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }
    try {
      new URL(formattedUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Firecrawl connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Scrape the URL with Firecrawl
    console.log("Scraping URL:", formattedUrl);
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", scrapeData);
      if (scrapeResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Firecrawl credits exhausted. Please upgrade your plan." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: scrapeData.error || `Scrape failed (${scrapeResponse.status})` }),
        { status: scrapeResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    if (!markdown || markdown.length < 50) {
      return new Response(
        JSON.stringify({ error: "Could not extract meaningful content from this URL. Try a different page." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Use AI to extract structured job listings
    console.log("Extracted", markdown.length, "chars. Sending to AI for extraction...");

    const trackList = (preferredTracks?.length > 0 ? preferredTracks : [
      "investment-banking", "private-equity", "venture-capital", "product-management", "growth-strategy"
    ]).join(", ");

    const systemPrompt = `You are a job listing extraction engine. Given scraped content from a job board or career page, extract all individual job postings into structured data.

CAREER TRACKS: ${trackList}

For each job found, classify it into exactly one career track based on the role's responsibilities:
- Consulting, growth advisory, business strategy → growth-strategy
- Private equity, wealth management, portfolio management → private-equity
- Venture capital, startup investing → venture-capital
- Investment banking, M&A, capital markets → investment-banking
- Product management, product strategy → product-management

Extract EVERY distinct job listing you can find. Return a JSON array of job objects. Each object must have:
- title (string - exact job title as listed)
- company (string - company name)
- description (string - full job description if available, otherwise a summary from context)
- location (string - city/state or "Remote")
- source (string - the website name, e.g. "LinkedIn", "Indeed", "Greenhouse", "Company Website")
- source_url (string - empty string if not available)
- career_track (string - one of: ${trackList})
- seniority (string - e.g. "Analyst", "Associate", "VP", "Director", "Senior", "Entry Level")
- work_mode (string - one of: remote, hybrid, onsite)
- salary_range (string - if mentioned, otherwise empty string)
- keywords (string array - 5-8 relevant keywords)

If the page contains a single job posting rather than a list, still return it as an array of one.
If no jobs can be extracted, return an empty array [].
Return ONLY valid JSON array, no markdown fencing.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract job listings from this scraped content:\n\n${markdown.slice(0, 30000)}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("No content from AI");

    const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const jobsArray = JSON.parse(cleaned);

    if (!Array.isArray(jobsArray)) throw new Error("AI did not return an array");
    if (jobsArray.length === 0) {
      return new Response(
        JSON.stringify({ success: true, jobsAdded: 0, message: "No job listings found on this page." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Insert into database
    const jobsToInsert = jobsArray.map((j: any) => ({
      title: String(j.title || "Untitled").slice(0, 500),
      company: String(j.company || "Unknown").slice(0, 500),
      description: String(j.description || "").slice(0, 10000),
      location: String(j.location || "").slice(0, 255),
      source: String(source || j.source || "Web Scrape").slice(0, 100),
      source_url: String(j.source_url || formattedUrl).slice(0, 2000),
      career_track: j.career_track || "product-management",
      seniority: String(j.seniority || "").slice(0, 100),
      work_mode: ["remote", "hybrid", "onsite"].includes(j.work_mode) ? j.work_mode : "onsite",
      salary_range: String(j.salary_range || "").slice(0, 100),
      keywords: Array.isArray(j.keywords) ? j.keywords.slice(0, 10) : [],
    }));

    const { error: insertError } = await supabase.from("jobs").insert(jobsToInsert);
    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save jobs to database");
    }

    console.log(`Successfully imported ${jobsToInsert.length} jobs from ${formattedUrl}`);
    return new Response(
      JSON.stringify({ success: true, jobsAdded: jobsToInsert.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scrape-jobs error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
