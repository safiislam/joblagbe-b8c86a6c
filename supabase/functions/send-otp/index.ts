import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone || !/^880\d{10}$/.test(phone)) {
      return new Response(JSON.stringify({ error: "Invalid Bangladesh phone number. Use format: 880XXXXXXXXXX" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const bulksmsApiKey = Deno.env.get("BULKSMS_API_KEY");
    const bulksmsSenderId = Deno.env.get("BULKSMS_SENDER_ID");

    if (!bulksmsApiKey || !bulksmsSenderId) {
      return new Response(JSON.stringify({ error: "SMS service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Rate limit: max 3 OTPs per phone per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("phone_otps")
      .select("*", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", tenMinAgo);

    if ((count ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: "Too many OTP requests. Please wait 10 minutes." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry

    // Store OTP
    const { error: insertError } = await supabase.from("phone_otps").insert({
      phone,
      otp_code: otp,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("OTP insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to generate OTP" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send SMS via BulkSMS BD
    const message = `Your Job Lagbe OTP is ${otp}`;
    const smsUrl = `http://bulksmsbd.net/api/smsapi`;
    
    const smsResponse = await fetch(smsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: bulksmsApiKey,
        senderid: bulksmsSenderId,
        number: phone,
        message: message,
      }),
    });

    const smsResult = await smsResponse.text();
    console.log("BulkSMS response:", smsResult);

    // Parse response - BulkSMS BD returns JSON with response_code
    let parsed: any;
    try {
      parsed = JSON.parse(smsResult);
    } catch {
      parsed = { response_code: 0 };
    }

    if (parsed.response_code !== 202 && parsed.response_code !== "202") {
      console.error("SMS send failed:", parsed);
      return new Response(JSON.stringify({ error: "Failed to send SMS. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "OTP sent successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-otp error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
