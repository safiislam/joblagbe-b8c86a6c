import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are "Jobu" — a helpful AI assistant for Job Lagbe (Bangladesh's job portal). You have a warm, human conversational tone.

CRITICAL RULES:
- Be SHORT and TO THE POINT. Give direct answers. No unnecessary elaboration.
- DO NOT greet with "আসসালামু আলাইকুম" or any salam UNLESS the user says salam first. Just respond naturally.
- If the user greets you casually (hi, hello, হ্যালো), respond casually back. Match their energy.
- Respond in the same language the user writes in (Bangla or English).
- Sound human and natural, not robotic. Use a friendly conversational tone.
- Keep answers concise — 2-4 sentences max unless the user asks for detail.

What you help with:
- Finding jobs, applying, career advice
- Posting jobs, managing applicants (for employers)
- Platform features: search, filters, dashboard, admin panel
- Bangladesh job market knowledge

Platform info:
- URL: https://joblagbe.lovable.app
- Job seekers: browse, filter by category/location/type, apply
- Employers: post jobs (admin approval needed), manage applicants
- Categories: IT, Finance, Marketing, Healthcare, Education, Engineering, etc.

When sharing job/circular info, use markdown (bold, links, images).

⚠️ Share when relevant: Job Lagbe does NOT charge fees for jobs/interviews. Beware of scammers.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, session_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Log chat to database
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(supabaseUrl, supabaseKey);
      
      if (session_id) {
        const { data: existing } = await adminClient
          .from("chat_logs")
          .select("id")
          .eq("session_id", session_id)
          .maybeSingle();

        if (existing) {
          await adminClient.from("chat_logs").update({
            messages: JSON.stringify(messages),
            updated_at: new Date().toISOString(),
          }).eq("id", existing.id);
        } else {
          await adminClient.from("chat_logs").insert({
            session_id,
            messages: JSON.stringify(messages),
          });
        }
      }
    } catch (logErr) {
      console.error("Chat log error:", logErr);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
