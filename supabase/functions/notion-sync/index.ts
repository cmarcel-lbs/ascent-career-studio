import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Maps our ApplicationStatus values to Notion select option names
const STATUS_TO_NOTION: Record<string, string> = {
  interested: "Interested",
  applying: "Applying",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      action,         // "push" | "pull" | "push-single"
      userId,
      notionToken,
      notionDatabaseId,
      application,    // for push-single: { jobId, status, jobTitle, company, jobTrack, notes }
    } = await req.json();

    if (!notionToken || !notionDatabaseId) {
      return new Response(
        JSON.stringify({ error: "notionToken and notionDatabaseId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notionHeaders = {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    // ─── PUSH SINGLE (called on drag/status change) ─────────────────────────
    if (action === "push-single") {
      if (!application) {
        return new Response(
          JSON.stringify({ error: "application data required for push-single" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if a page already exists for this job
      const queryRes = await fetch(
        `https://api.notion.com/v1/databases/${notionDatabaseId}/query`,
        {
          method: "POST",
          headers: notionHeaders,
          body: JSON.stringify({
            filter: {
              property: "Job ID",
              rich_text: { equals: application.jobId },
            },
          }),
        }
      );
      const queryData = await queryRes.json();

      const notionStatus = STATUS_TO_NOTION[application.status] || application.status;
      const properties = {
        Name: { title: [{ text: { content: application.jobTitle || "Unknown Role" } }] },
        Company: { rich_text: [{ text: { content: application.company || "" } }] },
        Status: { select: { name: notionStatus } },
        "Career Track": { select: { name: application.jobTrack || "" } },
        "Job ID": { rich_text: [{ text: { content: application.jobId } }] },
        ...(application.notes ? { Notes: { rich_text: [{ text: { content: application.notes } }] } } : {}),
      };

      if (queryData.results?.length > 0) {
        // Update existing page
        const pageId = queryData.results[0].id;
        const updateRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: "PATCH",
          headers: notionHeaders,
          body: JSON.stringify({ properties }),
        });
        if (!updateRes.ok) {
          const err = await updateRes.json();
          throw new Error(`Notion update failed: ${err.message || updateRes.status}`);
        }
      } else {
        // Create new page
        const createRes = await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: notionHeaders,
          body: JSON.stringify({
            parent: { database_id: notionDatabaseId },
            properties,
          }),
        });
        if (!createRes.ok) {
          const err = await createRes.json();
          throw new Error(`Notion create failed: ${err.message || createRes.status}`);
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── PUSH ALL (full sync from Supabase → Notion) ─────────────────────────
    if (action === "push") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId required for push" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Fetch all applications with their job details
      const { data: apps, error } = await supabase
        .from("job_applications")
        .select("*, jobs(*)")
        .eq("user_id", userId);

      if (error) throw new Error(`Supabase fetch failed: ${error.message}`);
      if (!apps || apps.length === 0) {
        return new Response(
          JSON.stringify({ success: true, synced: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let synced = 0;
      for (const app of apps) {
        const job = app.jobs as any;
        const notionStatus = STATUS_TO_NOTION[app.status] || app.status;
        const properties = {
          Name: { title: [{ text: { content: job?.title || "Unknown Role" } }] },
          Company: { rich_text: [{ text: { content: job?.company || "" } }] },
          Status: { select: { name: notionStatus } },
          "Career Track": { select: { name: job?.career_track || "" } },
          "Job ID": { rich_text: [{ text: { content: app.job_id } }] },
          ...(app.notes ? { Notes: { rich_text: [{ text: { content: app.notes } }] } } : {}),
        };

        // Check if page exists
        const queryRes = await fetch(
          `https://api.notion.com/v1/databases/${notionDatabaseId}/query`,
          {
            method: "POST",
            headers: notionHeaders,
            body: JSON.stringify({
              filter: { property: "Job ID", rich_text: { equals: app.job_id } },
            }),
          }
        );
        const queryData = await queryRes.json();

        if (queryData.results?.length > 0) {
          await fetch(`https://api.notion.com/v1/pages/${queryData.results[0].id}`, {
            method: "PATCH",
            headers: notionHeaders,
            body: JSON.stringify({ properties }),
          });
        } else {
          await fetch("https://api.notion.com/v1/pages", {
            method: "POST",
            headers: notionHeaders,
            body: JSON.stringify({
              parent: { database_id: notionDatabaseId },
              properties,
            }),
          });
        }
        synced++;
      }

      return new Response(
        JSON.stringify({ success: true, synced }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── PULL (Notion → Supabase status updates) ─────────────────────────────
    if (action === "pull") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId required for pull" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Fetch all Notion pages from the database
      const queryRes = await fetch(
        `https://api.notion.com/v1/databases/${notionDatabaseId}/query`,
        { method: "POST", headers: notionHeaders, body: JSON.stringify({}) }
      );
      const queryData = await queryRes.json();

      if (!queryData.results) throw new Error("Failed to query Notion database");

      const NOTION_TO_STATUS: Record<string, string> = {
        Interested: "interested",
        Applying: "applying",
        Applied: "applied",
        Interviewing: "interviewing",
        Offer: "offer",
        Rejected: "rejected",
      };

      let updated = 0;
      for (const page of queryData.results) {
        const jobIdProp = page.properties?.["Job ID"]?.rich_text?.[0]?.text?.content;
        const notionStatus = page.properties?.["Status"]?.select?.name;

        if (!jobIdProp || !notionStatus) continue;
        const supabaseStatus = NOTION_TO_STATUS[notionStatus];
        if (!supabaseStatus) continue;

        const { data: existing } = await supabase
          .from("job_applications")
          .select("id, status")
          .eq("user_id", userId)
          .eq("job_id", jobIdProp)
          .maybeSingle();

        if (existing && existing.status !== supabaseStatus) {
          await supabase
            .from("job_applications")
            .update({ status: supabaseStatus })
            .eq("id", existing.id);
          updated++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, updated }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("notion-sync error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
