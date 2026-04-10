import { useState } from "react";
import SeoHead from "@/components/SeoHead";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhoneOtpForm from "@/components/PhoneOtpForm";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { logoUrl } = useBrandSettings();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    setGoogleLoading(false);
    if (error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { toast.error("Enter your email"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent! Check your email.");
      setShowForgot(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4">
      <SeoHead title="লগইন" noIndex />
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-elevated">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/">
            <img src={logoUrl} alt="Job Lagbe" width={40} height={40} className="h-10 w-auto" />
          </Link>
          <h2 className="mt-4 text-xl font-bold">{showForgot ? "Reset Password" : "Welcome Back"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {showForgot ? "Enter your email to reset password" : "Login to your account"}
          </p>
        </div>

        {showForgot ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required placeholder="you@example.com" className="mt-1.5 rounded-xl" />
            </div>
            <Button type="submit" disabled={forgotLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl py-2.5">
              {forgotLoading ? "Sending..." : "Send Reset Link"}
            </Button>
            <button type="button" onClick={() => setShowForgot(false)} className="w-full text-center text-sm text-primary hover:underline">
              Back to Login
            </button>
          </form>
        ) : (
          <>
            {/* Google Sign In */}
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full gap-3 rounded-xl py-2.5 font-medium"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </Button>

            <div className="my-6 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            {/* Auth method tabs */}
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "email" | "phone")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="email">📧 Email</TabsTrigger>
                <TabsTrigger value="phone">📱 Phone</TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="form-group">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1.5 rounded-xl" />
                  </div>
                  <div className="form-group">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary hover:underline">
                        Forgot Password?
                      </button>
                    </div>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="mt-1.5 rounded-xl" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.01] active:scale-[0.99] font-semibold rounded-xl py-2.5 transition-transform">
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone">
                <PhoneOtpForm
                  action="login"
                  onSuccess={() => navigate("/")}
                />
              </TabsContent>
            </Tabs>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">Sign Up</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
