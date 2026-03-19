import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import MyServiceOrders from "@/components/MyServiceOrders";
import EditProfileDialog from "@/components/EditProfileDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, Clock, CheckCircle, XCircle, FileText, MapPin,
  Building2, Bookmark, Mail, Phone, Pencil, ShoppingBag, Filter, UserCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import ResumeUpload from "@/components/ResumeUpload";
import SaveJobButton from "@/components/SaveJobButton";
import VerifiedBadge from "@/components/VerifiedBadge";

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

type SavedJobRow = {
  id: string;
  job_id: string;
  created_at: string;
  jobs: {
    title: string;
    location: string;
    job_type: string;
    companies: { name: string } | null;
  } | null;
};

const statusConfig: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  pending: { icon: Clock, label: "Pending", color: "bg-accent/10 text-accent border-accent/30" },
  shortlisted: { icon: UserCheck, label: "Shortlisted", color: "bg-primary/10 text-primary border-primary/30" },
  accepted: { icon: CheckCircle, label: "Accepted", color: "bg-green-500/10 text-green-600 border-green-500/30" },
  rejected: { icon: XCircle, label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/30" },
};

const SeekerDashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState("all");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["my-applications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status, created_at, cover_letter, jobs(title, location, job_type, companies(name, is_verified))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data as unknown as ApplicationRow[]) ?? [];
    },
    enabled: !!user,
  });

  const { data: savedJobs, refetch: refetchSaved } = useQuery({
    queryKey: ["saved-jobs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_jobs")
        .select("id, job_id, created_at, jobs(title, location, job_type, companies(name, is_verified))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data as unknown as SavedJobRow[]) ?? [];
    },
    enabled: !!user,
  });

  if (loading) return null;

  const counts = {
    total: applications?.length ?? 0,
    pending: applications?.filter((a) => a.status === "pending").length ?? 0,
    accepted: applications?.filter((a) => a.status === "accepted").length ?? 0,
    saved: savedJobs?.length ?? 0,
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-2xl py-8">
        {/* Profile Card */}
        <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/80 to-accent/60" />

          <div className="px-6 pb-6">
            <div className="-mt-12 flex items-end justify-between">
              <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            </div>

            <div className="mt-3">
              <h1 className="text-xl font-bold">{profile?.full_name || "Job Seeker"}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {user?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {user.email}
                  </span>
                )}
                {profile?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {profile.phone}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              {[
                { label: "Applied", value: counts.total, color: "bg-primary/10 text-primary" },
                { label: "Pending", value: counts.pending, color: "bg-accent/10 text-accent" },
                { label: "Accepted", value: counts.accepted, color: "bg-green-500/10 text-green-600" },
                { label: "Saved", value: counts.saved, color: "bg-secondary text-secondary-foreground" },
              ].map((s) => (
                <div key={s.label} className={`flex-1 rounded-xl px-3 py-2.5 text-center ${s.color}`}>
                  <p className="text-lg font-bold leading-none">{s.value}</p>
                  <p className="mt-1 text-[11px] font-medium opacity-80">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="applications" className="mt-6">
          <TabsList className="w-full grid grid-cols-4 h-11">
            <TabsTrigger value="applications" className="gap-1.5 text-xs sm:text-sm">
              <Briefcase className="h-3.5 w-3.5" /> Applications
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5 text-xs sm:text-sm">
              <ShoppingBag className="h-3.5 w-3.5" /> Orders
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5 text-xs sm:text-sm">
              <Bookmark className="h-3.5 w-3.5" /> Saved Jobs
            </TabsTrigger>
            <TabsTrigger value="resume" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5" /> Resume
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="mt-4 space-y-3">
            {/* Status Filter */}
            {applications && applications.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { key: "all", label: "সকল", count: counts.total },
                  { key: "pending", label: "অপেক্ষমান", count: counts.pending },
                  { key: "shortlisted", label: "শর্টলিস্ট", count: applications?.filter(a => a.status === "shortlisted").length ?? 0 },
                  { key: "accepted", label: "গৃহীত", count: counts.accepted },
                  { key: "rejected", label: "প্রত্যাখ্যাত", count: applications?.filter(a => a.status === "rejected").length ?? 0 },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setAppStatusFilter(f.key)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                      appStatusFilter === f.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:bg-secondary"
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-2xl border bg-card shadow-card divide-y">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : (() => {
                const filteredApps = applications?.filter(a => appStatusFilter === "all" || a.status === appStatusFilter);
                return filteredApps && filteredApps.length > 0 ? (
                  filteredApps.map((app) => {
                    const config = statusConfig[app.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <Link to={`/jobs/${(app as any).job_id || ''}`} key={app.id} className="block p-4 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm">{app.jobs?.title ?? "Unknown Job"}</h3>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${config.color}`}>
                                <StatusIcon className="mr-1 h-3 w-3" /> {config.label}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />{app.jobs?.companies?.name}
                                {(app.jobs?.companies as any)?.is_verified && <VerifiedBadge className="h-3 w-3" />}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{app.jobs?.location}
                              </span>
                              <span>{formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center py-14 text-muted-foreground">
                    <FileText className="mb-3 h-10 w-10 opacity-30" />
                    <p className="font-medium">{appStatusFilter !== "all" ? "এই ক্যাটাগরিতে কোনো আবেদন নেই" : "No applications yet"}</p>
                    <p className="mt-1 text-sm">Browse jobs and apply to get started!</p>
                    <Button className="mt-4" asChild>
                      <Link to="/#jobs">Browse Jobs</Link>
                    </Button>
                  </div>
                );
              })()}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <MyServiceOrders />
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            <div className="rounded-2xl border bg-card shadow-card divide-y">
              {savedJobs && savedJobs.length > 0 ? (
                savedJobs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{s.jobs?.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />{s.jobs?.companies?.name}
                          {(s.jobs?.companies as any)?.is_verified && <VerifiedBadge className="h-3 w-3" />}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{s.jobs?.location}
                        </span>
                      </div>
                    </div>
                    <SaveJobButton jobId={s.job_id} saved onToggle={() => refetchSaved()} size="icon" />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center py-14 text-muted-foreground">
                  <Bookmark className="mb-3 h-10 w-10 opacity-30" />
                  <p className="font-medium">No saved jobs</p>
                  <p className="mt-1 text-sm">Save jobs you're interested in!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resume" className="mt-4">
            <ResumeUpload />
          </TabsContent>
        </Tabs>
      </div>

      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
};

export default SeekerDashboard;
