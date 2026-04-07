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
    const { phone, otp, action, full_name, role } = await req.json();

    if (!phone || !otp || !action) {
      return new Response(JSON.stringify({ error: "Phone, OTP, and action are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!/^880\d{10}$/.test(phone)) {
      return new Response(JSON.stringify({ error: "Invalid phone number format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from("phone_otps")
      .select("*")
      .eq("phone", phone)
      .eq("otp_code", otp)
      .eq("is_used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return new Response(JSON.stringify({ error: "Invalid or expired OTP" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark OTP as used
    await supabase.from("phone_otps").update({ is_used: true }).eq("id", otpRecord.id);

    const fakeEmail = `${phone}@phone.joblagbe.bd`;
    const tempPassword = `phone_${phone}_${Date.now()}`;

    if (action === "signup") {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email === fakeEmail || u.phone === phone
      );

      if (existingUser) {
        return new Response(JSON.stringify({ error: "This phone number is already registered. Please login instead." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create user with service role
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: fakeEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || "",
          role: role || "seeker",
          phone: phone,
        },
      });

      if (createError) {
        console.error("User creation error:", createError);
        return new Response(JSON.stringify({ error: "Failed to create account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile phone
      if (newUser?.user) {
        await supabase.from("profiles").update({ phone }).eq("user_id", newUser.user.id);
      }

      // Sign in the user
      const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: tempPassword,
      });

      if (signInError) {
        console.error("Sign in error after signup:", signInError);
        return new Response(JSON.stringify({ error: "Account created but login failed. Try logging in." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        action: "signup",
        session: session.session,
        user: session.user,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "login") {
      // Find user by phone email pattern
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email === fakeEmail
      );

      if (!existingUser) {
        return new Response(JSON.stringify({ error: "No account found with this phone number. Please sign up first." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update password and sign in
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: tempPassword,
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        return new Response(JSON.stringify({ error: "Login failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: tempPassword,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        return new Response(JSON.stringify({ error: "Login failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        action: "login",
        session: session.session,
        user: session.user,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'signup' or 'login'." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
