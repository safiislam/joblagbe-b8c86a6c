import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"seeker" | "employer">("seeker");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Update profile role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ role }).eq("user_id", user.id);
    }

    toast.success("Account created! Check your email to confirm.");
    setLoading(false);
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-elevated">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold">
            <Briefcase className="h-6 w-6 text-accent" /> Job Lagbe
          </Link>
          <p className="mt-2 text-muted-foreground">Create your account</p>
        </div>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your full name" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
          </div>
          <div>
            <Label>I am a</Label>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setRole("seeker")}
                className={`flex-1 rounded-lg border p-3 text-sm font-medium transition-colors ${role === "seeker" ? "border-primary bg-primary/10 text-primary" : "hover:border-muted-foreground"}`}
              >
                Job Seeker
              </button>
              <button
                type="button"
                onClick={() => setRole("employer")}
                className={`flex-1 rounded-lg border p-3 text-sm font-medium transition-colors ${role === "employer" ? "border-primary bg-primary/10 text-primary" : "hover:border-muted-foreground"}`}
              >
                Employer
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
