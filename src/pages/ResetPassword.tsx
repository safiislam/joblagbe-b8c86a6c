import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useBrandSettings } from "@/hooks/useBrandSettings";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { logoUrl } = useBrandSettings();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/");
    }
  };

  if (!isRecovery) {
    return (
      <>
        <SeoHead noIndex />
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-elevated text-center">
            <Link to="/">
              <img src={logoUrl} alt="Job Lagbe" width={40} height={40} className="mx-auto h-10 w-auto" />
            </Link>
            <h2 className="mt-6 text-xl font-bold">Invalid Reset Link</h2>
            <p className="mt-2 text-sm text-muted-foreground">This link is invalid or expired. Please request a new password reset.</p>
            <Button className="mt-6 bg-accent text-accent-foreground" asChild>
              <Link to="/login">Back to Login</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead noIndex />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-elevated">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/">
            <img src={logoUrl} alt="Job Lagbe" width={40} height={40} className="h-10 w-auto" />
          </Link>
          <h2 className="mt-4 text-xl font-bold">Set New Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter your new password below</p>
        </div>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm password" className="mt-1.5 rounded-xl" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl py-2.5">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
