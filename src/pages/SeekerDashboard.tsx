import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, CheckCircle, XCircle, FileText, MapPin, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  cover_letter: string | null;
  jobs: {
    title: string;
    location: string;
    job_type: string;
    companies: { name: string } | null;
  } | null;
};

const statusConfig: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  pending: { icon: Clock, label: "Pending", color: "border-accent text-accent" },
  accepted: { icon: CheckCircle, label: "Accepted", color: "border-success text-success" },
  rejected: { icon: XCircle, label: "Rejected", color: "border-destructive text-destructive" },
};

const SeekerDashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["my-applications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status, created_at, cover_letter, jobs(title, location, job_type, companies(name))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data as unknown as ApplicationRow[]) ?? [];
    },
    enabled: !!user,
  });

  if (loading) return null;

  const counts = {
    total: applications?.length ?? 0,
    pending: applications?.filter((a) => a.status === "pending").length ?? 0,
    accepted: applications?.filter((a) => a.status === "accepted").length ?? 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-bangla">আমার আবেদনসমূহ</h1>
          <p className="mt-1 text-muted-foreground">Track your job applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total", value: counts.total, color: "text-primary" },
            { label: "Pending", value: counts.pending, color: "text-accent" },
            { label: "Accepted", value: counts.accepted, color: "text-success" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-card text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Applications list */}
        <div className="rounded-2xl border bg-card shadow-card">
          <div className="border-b p-4">
            <h2 className="font-bold text-lg">Applications</h2>
          </div>
          <div className="divide-y">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : applications && applications.length > 0 ? (
              applications.map((app) => {
                const config = statusConfig[app.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <div key={app.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{app.jobs?.title ?? "Unknown Job"}</h3>
                        <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                          <StatusIcon className="mr-1 h-3 w-3" /> {config.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{app.jobs?.companies?.name}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.jobs?.location}</span>
                        <span>{formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center py-14 text-muted-foreground">
                <FileText className="mb-3 h-10 w-10 opacity-30" />
                <p className="font-medium">No applications yet</p>
                <p className="mt-1 text-sm">Browse jobs and apply to get started!</p>
                <Button className="mt-4 bg-accent text-accent-foreground" asChild>
                  <Link to="/#jobs">Browse Jobs</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeekerDashboard;
