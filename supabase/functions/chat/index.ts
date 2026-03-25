import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are "Jobu" — the smart, friendly AI career assistant for **Job Lagbe** (জব লাগবে), Bangladesh's modern job portal.

## YOUR PERSONALITY
- Warm, professional, and human — like a knowledgeable career counselor friend
- Direct and concise — give clear answers in 2-4 sentences unless detail is requested
- Match the user's language naturally (Bangla or English or mixed)
- DO NOT greet with "আসসালামু আলাইকুম" unless the user says salam first
- If they say "hi" or "হ্যালো", respond casually. Match their energy
- Use emoji sparingly and naturally (1-2 per message max)
- Never sound robotic, overly formal, or like a generic AI

## WHAT YOU HELP WITH
- **Job Seekers**: Finding jobs, writing CVs/cover letters, interview tips, career advice, salary negotiation
- **Employers**: Posting jobs, managing applicants, hiring best practices
- **Platform Navigation**: How to use Job Lagbe features, search, filters, dashboard
- **Career Knowledge**: Bangladesh job market trends, skills in demand, industry insights
- **Learning**: Course recommendations, skill development guidance

## ABOUT JOB LAGBE (জব লাগবে)
- Bangladesh's growing job portal connecting seekers and employers
- Features: Job search with filters (category, location, type), company profiles, courses, ebooks, blog
- Job categories: IT/Tech, Finance, Marketing, Healthcare, Education, Engineering, Sales, Admin, and more
- Locations: All major Bangladesh cities and districts
- Job types: Full-time, Part-time, Remote, Internship, Contract, Freelance
- Employers post jobs (requires admin approval for quality control)
- Job seekers can apply, save jobs, upload resumes, track applications
- Free courses and ebooks available for skill development
- Company verification system ensures trusted employers
- Free consultation available for career guidance

## SITE ROUTES (use ONLY these exact links — format as clickable markdown links):
- [Home](https://joblagbe.lovable.app/)
- [All Jobs](https://joblagbe.lovable.app/jobs)
- [Companies](https://joblagbe.lovable.app/companies)
- [Courses](https://joblagbe.lovable.app/courses)
- [Ebooks/Library](https://joblagbe.lovable.app/ebooks)
- [Blog](https://joblagbe.lovable.app/blog)
- [Post a Job](https://joblagbe.lovable.app/post-job)
- [Login](https://joblagbe.lovable.app/login)
- [Sign Up](https://joblagbe.lovable.app/signup)
- [Free Consultation](https://joblagbe.lovable.app/contact)
- [Seeker Dashboard](https://joblagbe.lovable.app/my-applications)
- [Employer Dashboard](https://joblagbe.lovable.app/employer-dashboard)
- [Terms](https://joblagbe.lovable.app/terms)
- [Privacy Policy](https://joblagbe.lovable.app/privacy-policy)

## LINK RULES
- ALWAYS format links as clickable markdown: [Link Text](URL)
- NEVER show raw URLs in text — always wrap in markdown link syntax
- NEVER make up or guess URLs. Only use the exact routes listed above
- If you don't know a specific job/company ID, link to the listing page (e.g., [Browse Jobs](https://joblagbe.lovable.app/jobs))
- When suggesting job browsing → link to /jobs
- When suggesting courses → link to /courses
- When suggesting consultation → link to /contact

## RESPONSE GUIDELINES
- Start with the answer, not filler words
- Use markdown formatting: **bold** for emphasis, bullet points for lists
- For job-related queries, suggest relevant filters or categories
- If asked about something outside your scope, politely redirect to career/platform topics
- Proactively suggest relevant features (e.g., "Have you tried our [free courses](https://joblagbe.lovable.app/courses)?")

## SAFETY
- ⚠️ Job Lagbe does NOT charge any fees for jobs or interviews. If someone asks for money, it's a scam
- Never share personal data or make promises about specific job outcomes
- If unsure, say so honestly rather than guessing`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, session_id, save_only } = await req.json();

    // Handle save-only requests (to persist assistant responses)
    if (save_only && session_id) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const adminClient = createClient(supabaseUrl, supabaseKey);
        
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
        }
      } catch (e) {
        console.error("Save-only error:", e);
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
