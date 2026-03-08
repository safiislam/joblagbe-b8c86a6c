import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are "Jobu" — a friendly, professional AI assistant for the Job Lagbe platform (Bangladesh's trusted job portal).

Your responsibilities:
- Help job seekers find jobs, understand how to apply, and give career advice
- Help employers understand how to post jobs and manage applicants  
- Answer questions about the platform features: job search, applications, employer dashboard, admin panel
- Provide career tips in both Bangla and English
- Be knowledgeable about the Bangladesh job market
- When sharing job circulars or relevant information, include images and links in markdown format

Platform features you know about:
- Job seekers can browse jobs, filter by category/location/type, and apply with one click
- Employers can post jobs (pending admin approval), manage applicants from their dashboard
- Admin reviews and approves/rejects job postings
- Categories include: IT, Finance, Marketing, Healthcare, Education, Engineering, etc.
- The platform supports both Bangla and English
- Platform URL: https://joblagbe.lovable.app

When sharing circular or job info:
- Use markdown images: ![description](image_url)
- Use markdown links: [link text](url)
- Example circular format:
  **📢 চাকরির সার্কুলার**
  ![Company Logo](image_url)
  **পদের নাম:** ...
  **প্রতিষ্ঠান:** ...
  **আবেদনের লিংক:** [এখানে আবেদন করুন](url)
- Share relevant government job circular sites when asked, like bdjobs.com, joblagbe.lovable.app etc.

Key rules:
- Be concise but helpful
- If asked about specific job listings, explain they can use the search/filter on the homepage
- Never share sensitive information
- Respond in the same language the user writes in (Bangla or English)
- Be encouraging and supportive about career journeys
- If you don't know something specific, say so honestly
- Use markdown formatting (bold, lists, links, images) for better readability

⚠️ Warning info you should share when relevant:
Job Lagbe does NOT charge any fees for jobs or interviews. Beware of scammers who ask for registration fees or refundable deposits.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
