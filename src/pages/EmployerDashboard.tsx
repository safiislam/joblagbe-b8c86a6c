import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Users, Clock, CheckCircle, Eye, XCircle, UserCheck, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type EmployerJob = {
  id: string;
  title: string;
  location: string;
  job_type: string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
};

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  cover_letter: string | null;
  profiles: { full_name: string | null } | null;
};

const EmployerDashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "employer")) navigate("/");
  }, [user, profile, loading, navigate]);

  const { data: company } = useQuery({
    queryKey: ["my-company", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: myJobs } = useQuery({
    queryKey: ["employer-jobs", company?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, location, job_type, is_active, is_approved, created_at")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      return (data as unknown as EmployerJob[]) ?? [];
    },
    enabled: !!company,
  });

  const { data: applicants } = useQuery({
    queryKey: ["job-applicants", selectedJobId],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status, created_at, cover_letter, user_id")
        .eq("job_id", selectedJobId!);
      
      if (!data || data.length === 0) return [];
      
      // Fetch profiles for applicants
      const userIds = data.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      
      const profileMap: Record<string, string | null> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p.full_name; });
      
      return data.map(a => ({
        ...a,
        profiles: { full_name: profileMap[a.user_id] || null }
      })) as ApplicationRow[];
    },
    enabled: !!selectedJobId,
  });

  if (loading || !user) return null;

  const totalJobs = myJobs?.length ?? 0;
  const pendingJobs = myJobs?.filter(j => !j.is_approved).length ?? 0;
  const approvedJobs = myJobs?.filter(j => j.is_approved).length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Employer Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">{company?.name || "Set up your company to start posting"}</p>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 font-semibold self-start" asChild>
            <Link to="/post-job"><Plus className="h-4 w-4" /> Post New Job</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Jobs", value: totalJobs, icon: Briefcase, color: "text-primary" },
            { label: "Pending Approval", value: pendingJobs, icon: Clock, color: "text-accent" },
            { label: "Active", value: approvedJobs, icon: CheckCircle, color: "text-success" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-card">
              <s.icon className={`h-6 w-6 ${s.color}`} />
              <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Jobs list */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border bg-card shadow-card">
              <div className="border-b p-4">
                <h2 className="font-bold text-lg">Your Jobs</h2>
              </div>
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {myJobs && myJobs.length > 0 ? (
                  myJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`w-full p-4 text-left transition-colors hover:bg-secondary/50 ${
                        selectedJobId === job.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{job.title}</h3>
                        {!job.is_approved && (
                          <Badge variant="outline" className="border-accent text-accent text-[10px]">Pending</Badge>
                        )}
                        {job.is_approved && (
                          <Badge variant="outline" className="border-success text-success text-[10px]">Live</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {job.location} · {job.job_type} · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center py-10 text-muted-foreground">
                    <Briefcase className="mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm">No jobs posted yet</p>
                    <Button size="sm" className="mt-3 bg-accent text-accent-foreground" asChild>
                      <Link to="/post-job">Post Your First Job</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Applicants panel */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border bg-card shadow-card">
              <div className="border-b p-4">
                <h2 className="font-bold text-lg">
                  {selectedJobId ? "Applicants" : "Select a job to view applicants"}
                </h2>
              </div>
              <div className="divide-y">
                {selectedJobId ? (
                  applicants && applicants.length > 0 ? (
                    applicants.map((app) => (
                      <div key={app.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{app.profiles?.full_name || "Anonymous"}</p>
                            <p className="text-sm text-muted-foreground">
                              Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge variant="outline" className={
                            app.status === "accepted" ? "border-success text-success" :
                            app.status === "rejected" ? "border-destructive text-destructive" :
                            "border-accent text-accent"
                          }>
                            {app.status}
                          </Badge>
                        </div>
                        {app.cover_letter && (
                          <p className="mt-2 text-sm text-muted-foreground bg-secondary/50 rounded-xl p-3">{app.cover_letter}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center py-14 text-muted-foreground">
                      <Users className="mb-2 h-8 w-8 opacity-30" />
                      <p className="text-sm">No applicants yet</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center py-14 text-muted-foreground">
                    <Eye className="mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm">Click on a job to see who applied</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
