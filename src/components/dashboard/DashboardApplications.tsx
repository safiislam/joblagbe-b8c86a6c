import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, Clock, CheckCircle, XCircle, UserCheck, FileText,
  Mail, Phone, User, Briefcase, Building2, Filter,
} from "lucide-react";

const statusConfig: Record<string, { label: string; labelBn: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", labelBn: "অপেক্ষমান", color: "bg-warning/15 text-warning border-warning/20", icon: Clock },
  shortlisted: { label: "Shortlisted", labelBn: "শর্টলিস্ট", color: "bg-primary/15 text-primary border-primary/20", icon: UserCheck },
  accepted: { label: "Accepted", labelBn: "গৃহীত", color: "bg-success/15 text-success border-success/20", icon: CheckCircle },
  rejected: { label: "Rejected", labelBn: "প্রত্যাখ্যাত", color: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle },
};

type AppRow = {
  id: string;
  status: string;
  created_at: string;
  cover_letter: string | null;
  user_id: string;
  job_id: string;
  jobs: { title: string; companies: { name: string } | null } | null;
  applicant_profile?: { full_name: string | null; phone: string | null; email?: string | null };
  resume_doc?: { file_url: string; file_name: string } | null;
};

const DashboardApplications = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: apps, isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status, created_at, cover_letter, user_id, job_id, jobs(title, companies(name))")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!data || data.length === 0) return [];

      // Fetch profiles for all applicants
      const userIds = [...new Set(data.map((a: any) => a.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, resume_url")
        .in("user_id", userIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach((p) => {
        profileMap[p.user_id] = p;
      });

      return data.map((a: any) => ({
        ...a,
        applicant_profile: profileMap[a.user_id] || null,
      })) as AppRow[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", appId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      toast.success(`Application ${status}`);
    },
    onError: () => toast.error("Failed to update status"),
  });

  const filtered = apps?.filter((app) => {
    const matchStatus = statusFilter === "all" || app.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchSearch =
      !search ||
      app.applicant_profile?.full_name?.toLowerCase().includes(searchLower) ||
      app.jobs?.title?.toLowerCase().includes(searchLower) ||
      app.jobs?.companies?.name?.toLowerCase().includes(searchLower);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: apps?.length ?? 0,
    pending: apps?.filter((a) => a.status === "pending").length ?? 0,
    shortlisted: apps?.filter((a) => a.status === "shortlisted").length ?? 0,
    accepted: apps?.filter((a) => a.status === "accepted").length ?? 0,
    rejected: apps?.filter((a) => a.status === "rejected").length ?? 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Applications ({counts.all})</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: "pending", ...statusConfig.pending, count: counts.pending },
          { key: "shortlisted", ...statusConfig.shortlisted, count: counts.shortlisted },
          { key: "accepted", ...statusConfig.accepted, count: counts.accepted },
          { key: "rejected", ...statusConfig.rejected, count: counts.rejected },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(statusFilter === s.key ? "all" : s.key)}
              className={`rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
                statusFilter === s.key ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-lg font-bold">{s.count}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, job, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filtered && filtered.length > 0 ? (
          filtered.map((app) => {
            const cfg = statusConfig[app.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === app.id;

            return (
              <div key={app.id} className="p-4">
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-sm">
                          {app.applicant_profile?.full_name || "Unknown Applicant"}
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 gap-1 ${cfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {app.jobs?.title ?? "Unknown Job"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {app.jobs?.companies?.name ?? "—"}
                        </span>
                        <span>{formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {app.applicant_profile?.phone && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {app.applicant_profile.phone}
                        </span>
                      )}
                    </div>

                    {/* Cover Letter */}
                    {app.cover_letter && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Cover Letter</p>
                        <p className="text-sm bg-secondary/50 rounded-xl p-3 whitespace-pre-wrap">
                          {app.cover_letter}
                        </p>
                      </div>
                    )}

                    {/* Resume */}
                    {app.applicant_profile?.resume_url && (
                      <a
                        href={supabase.storage.from("resumes").getPublicUrl(app.applicant_profile.resume_url).data.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" /> View Resume
                      </a>
                    )}

                    {/* Status Actions */}
                    <div className="flex flex-wrap gap-2">
                      {app.status !== "shortlisted" && app.status !== "accepted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground"
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ appId: app.id, status: "shortlisted" })}
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Shortlist
                        </Button>
                      )}
                      {app.status !== "accepted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-success border-success/30 hover:bg-success hover:text-white"
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ appId: app.id, status: "accepted" })}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Accept
                        </Button>
                      )}
                      {app.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ appId: app.id, status: "rejected" })}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      )}
                      {app.status !== "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-muted-foreground"
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ appId: app.id, status: "pending" })}
                        >
                          <Clock className="h-3.5 w-3.5" /> Reset to Pending
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {search || statusFilter !== "all" ? "No matching applications found" : "No applications yet"}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardApplications;
