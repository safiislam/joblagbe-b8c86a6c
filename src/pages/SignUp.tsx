import { useState } from "react";
import SeoHead from "@/components/SeoHead";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Checkbox } from "@/components/ui/checkbox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Briefcase, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhoneOtpForm from "@/components/PhoneOtpForm";

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const { logoUrl } = useBrandSettings();
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [role, setRole] = useState<"seeker" | "employer">("seeker");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error("You must agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: trimmed,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Account created! Check your email to confirm.");
    setLoading(false);
    navigate("/");
  };

  const handleGoogleSignUp = async () => {
    if (!agreedToTerms) {
      toast.error("You must agree to the Terms & Conditions and Privacy Policy.");
      return;
    }
    setGoogleLoading(true);
    localStorage.setItem("pending_signup_role", role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          role: role,
        },
      },
    });
    setGoogleLoading(false);
    if (error) {
      localStorage.removeItem("pending_signup_role");
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-8">
      <SeoHead title="রেজিস্ট্রেশন" noIndex />
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-elevated">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link to="/">
            <img src={logoUrl} alt="Job Lagbe" width={40} height={40} className="h-10 w-auto" />
          </Link>
          <h2 className="mt-4 text-xl font-bold">Create Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Join Job Lagbe today</p>
        </div>

        {/* Google Sign Up */}
        <Button
          variant="outline"
          onClick={handleGoogleSignUp}
          disabled={googleLoading || !agreedToTerms}
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

        <div className="my-5 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        {/* Role selector - always visible */}
        <div className="mb-4">
          <Label>I am a</Label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("seeker")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3.5 text-sm font-medium transition-all ${
                role === "seeker" ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20" : "hover:border-muted-foreground"
              }`}
            >
              <Search className="h-5 w-5" />
              Job Seeker
            </button>
            <button
              type="button"
              onClick={() => setRole("employer")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3.5 text-sm font-medium transition-all ${
                role === "employer" ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20" : "hover:border-muted-foreground"
              }`}
            >
              <Briefcase className="h-5 w-5" />
              Employer
            </button>
          </div>
        </div>

        {/* Auth method tabs */}
        <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "email" | "phone")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="email">📧 Email</TabsTrigger>
            <TabsTrigger value="phone">📱 Phone</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your full name" className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" className="mt-1.5 rounded-xl" />
              </div>
              {/* Terms agreement */}
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="terms-email"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms-email" className="text-xs leading-relaxed text-muted-foreground cursor-pointer">
                  I agree to the{" "}
                  <Link to="/terms" target="_blank" className="text-primary underline hover:opacity-80">Terms & Conditions</Link>
                  {" "}and{" "}
                  <Link to="/privacy-policy" target="_blank" className="text-primary underline hover:opacity-80">Privacy Policy</Link>
                </label>
              </div>
              <Button type="submit" disabled={loading || !agreedToTerms} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl py-2.5">
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone">
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullNamePhone">Full Name</Label>
                <Input id="fullNamePhone" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="mt-1.5 rounded-xl" />
              </div>
              {/* Terms agreement */}
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="terms-phone"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms-phone" className="text-xs leading-relaxed text-muted-foreground cursor-pointer">
                  I agree to the{" "}
                  <Link to="/terms" target="_blank" className="text-primary underline hover:opacity-80">Terms & Conditions</Link>
                  {" "}and{" "}
                  <Link to="/privacy-policy" target="_blank" className="text-primary underline hover:opacity-80">Privacy Policy</Link>
                </label>
              </div>
              <PhoneOtpForm
                action="signup"
                fullName={fullName}
                role={role}
                disabled={!agreedToTerms}
                onSuccess={() => navigate("/")}
              />
            </div>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
