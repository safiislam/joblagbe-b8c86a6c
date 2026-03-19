import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    // Deactivate jobs whose deadline has passed
    const { data, error } = await supabase
      .from("jobs")
      .update({ is_active: false })
      .eq("is_active", true)
      .not("application_deadline", "is", null)
      .lt("application_deadline", now)
      .select("id, title");

    if (error) throw error;

    console.log(`Closed ${data?.length ?? 0} expired jobs`);

    return new Response(
      JSON.stringify({ closed: data?.length ?? 0, jobs: data }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error closing expired jobs:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
