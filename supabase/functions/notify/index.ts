import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const getLinkForType = (type: string, resourceId?: string): string | null => {
  const links: Record<string, string> = {
    new_application: "/employer-dashboard",
    job_approved: "/employer-dashboard",
    job_rejected: "/employer-dashboard",
    application_shortlisted: "/my-applications",
    application_accepted: "/my-applications",
    application_rejected: "/my-applications",
    course_approved: "/employer-dashboard",
    course_rejected: "/employer-dashboard",
    verification_approved: "/employer-dashboard",
    verification_rejected: "/employer-dashboard",
  };
  return links[type] || null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { type, resource_id, user_id, title, message } = await req.json();

    if (!user_id || !title || !message) {
      return new Response(JSON.stringify({ error: "user_id, title, message required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const link = getLinkForType(type, resource_id);

    // Insert in-app notification
    const { error: notifError } = await adminClient.from("notifications").insert({
      user_id,
      title,
      message,
      type: type || "info",
      link,
    });

    if (notifError) {
      console.error("Notification insert error:", notifError);
    }

    // Log as user activity
    const resourceType = type?.includes("job") ? "job" 
      : type?.includes("course") ? "course" 
      : type?.includes("application") ? "application"
      : type?.includes("verification") ? "company"
      : "other";

    await adminClient.from("user_activity").insert({
      user_id,
      action: type || "notification",
      resource_type: resourceType,
      resource_id,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
