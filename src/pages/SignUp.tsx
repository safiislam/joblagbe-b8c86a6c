import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Briefcase, Search } from "lucide-react";
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

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ role }).eq("user_id", user.id);
    }

    toast.success("Account created! Check your email to confirm.");
    setLoading(false);
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-elevated">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/">
            <img src={logo} alt="Job Lagbe" className="h-10 w-auto" />
          </Link>
          <h2 className="mt-4 text-xl font-bold">Create Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Join Job Lagbe today</p>
        </div>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your full name" className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>I am a</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("seeker")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                  role === "seeker" ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20" : "hover:border-muted-foreground"
                }`}
              >
                <Search className="h-5 w-5" />
                Job Seeker
              </button>
              <button
                type="button"
                onClick={() => setRole("employer")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                  role === "employer" ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20" : "hover:border-muted-foreground"
                }`}
              >
                <Briefcase className="h-5 w-5" />
                Employer
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl py-2.5">
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
