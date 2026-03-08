import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Shield, Users, Briefcase, Building2, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [jobs, companies, applications] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
      ]);
      return {
        jobs: jobs.count ?? 0,
        companies: companies.count ?? 0,
        applications: applications.count ?? 0,
      };
    },
    enabled: isAdmin,
  });

  if (loading || !isAdmin) return null;

  const cards = [
    { icon: Briefcase, label: "Total Jobs", value: stats?.jobs ?? 0, color: "text-primary" },
    { icon: Building2, label: "Companies", value: stats?.companies ?? 0, color: "text-accent" },
    { icon: Users, label: "Applications", value: stats?.applications ?? 0, color: "text-success" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage your Job Lagbe platform</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <c.icon className={`h-8 w-8 ${c.color}`} />
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-4 text-3xl font-bold">{c.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="text-muted-foreground">Full admin management panel coming soon.</p>
          <p className="mt-1 text-sm text-muted-foreground">You can manage jobs, users, and content from here.</p>
        </div>
      </div>
    </div>
  );
};

export default Admin;
