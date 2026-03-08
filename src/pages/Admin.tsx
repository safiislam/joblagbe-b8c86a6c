import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Shield, Users, Briefcase, Building2, BarChart3, Check, X, Clock, Eye } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

type AdminJob = {
  id: string;
  title: string;
  location: string;
  job_type: string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  companies: { name: string } | null;
};

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "all">("pending");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [jobs, companies, applications, pending] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_approved", false),
      ]);
      return {
        jobs: jobs.count ?? 0,
        companies: companies.count ?? 0,
        applications: applications.count ?? 0,
        pending: pending.count ?? 0,
      };
    },
    enabled: isAdmin,
  });

  const { data: adminJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["admin-jobs", tab],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("id, title, location, job_type, is_active, is_approved, created_at, companies(name)")
        .order("created_at", { ascending: false });

      if (tab === "pending") query = query.eq("is_approved", false);
      if (tab === "approved") query = query.eq("is_approved", true);

      const { data } = await query;
      return (data as unknown as AdminJob[]) ?? [];
    },
    enabled: isAdmin,
  });

  const handleApprove = async (jobId: string) => {
    const { error } = await supabase.from("jobs").update({ is_approved: true }).eq("id", jobId);
    if (error) { toast.error(error.message); return; }
    toast.success("Job approved!");
    queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  };

  const handleReject = async (jobId: string) => {
    const { error } = await supabase.from("jobs").update({ is_active: false, is_approved: false }).eq("id", jobId);
    if (error) { toast.error(error.message); return; }
    toast.success("Job rejected");
    queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  if (loading || !isAdmin) return null;

  const statCards = [
    { icon: Briefcase, label: "Total Jobs", value: stats?.jobs ?? 0, color: "text-primary" },
    { icon: Clock, label: "Pending Review", value: stats?.pending ?? 0, color: "text-accent" },
    { icon: Building2, label: "Companies", value: stats?.companies ?? 0, color: "text-success" },
    { icon: Users, label: "Applications", value: stats?.applications ?? 0, color: "text-primary" },
  ];

  const tabs = [
    { key: "pending" as const, label: "Pending", count: stats?.pending },
    { key: "approved" as const, label: "Approved", count: null },
    { key: "all" as const, label: "All Jobs", count: stats?.jobs },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage jobs, companies, and applications</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((c) => (
            <div key={c.label} className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <c.icon className={`h-7 w-7 ${c.color}`} />
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-2xl font-bold lg:text-3xl">{c.value}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Job Management */}
        <div className="rounded-2xl border bg-card shadow-card">
          <div className="flex items-center gap-1 border-b p-4 overflow-x-auto">
            <h2 className="mr-4 font-bold text-lg shrink-0">Job Management</h2>
            {tabs.map((t) => (
              <Button
                key={t.key}
                variant={tab === t.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setTab(t.key)}
                className="gap-1.5 shrink-0"
              >
                {t.label}
                {t.count != null && t.count > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t.count}</Badge>
                )}
              </Button>
            ))}
          </div>

          <div className="divide-y">
            {jobsLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : adminJobs && adminJobs.length > 0 ? (
              adminJobs.map((job) => (
                <div key={job.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{job.title}</h3>
                      {!job.is_approved && (
                        <Badge variant="outline" className="border-accent text-accent text-[10px]">Pending</Badge>
                      )}
                      {job.is_approved && (
                        <Badge variant="outline" className="border-success text-success text-[10px]">Approved</Badge>
                      )}
                      {!job.is_active && (
                        <Badge variant="outline" className="border-destructive text-destructive text-[10px]">Inactive</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground truncate">
                      {job.companies?.name} · {job.location} · {job.job_type} · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!job.is_approved && job.is_active && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(job.id)} className="gap-1 bg-success text-success-foreground hover:bg-success/90">
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(job.id)} className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}
                    {job.is_approved && (
                      <Button size="sm" variant="ghost" onClick={() => handleReject(job.id)} className="gap-1 text-destructive">
                        <X className="h-3.5 w-3.5" /> Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                {tab === "pending" ? "No pending jobs to review 🎉" : "No jobs found"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
