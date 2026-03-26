import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, Tag, EyeOff, Trash2, Building2, MapPin, Calendar, DollarSign, Link2, Phone, Globe, ShieldCheck } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type AdminJob = {
  id: string; title: string; location: string; job_type: string;
  is_active: boolean; is_approved: boolean; created_at: string; description: string;
  tag: string | null; hide_apply: boolean;
  salary_min: number | null; salary_max: number | null;
  application_deadline: string | null; source_url: string | null;
  requirements: string[] | null;
  companies: { name: string; logo_url: string | null; is_verified: boolean; phone: string | null; website: string | null } | null;
  categories: { name: string } | null;
};

const DashboardJobs = () => {
  const queryClient = useQueryClient();
  const [jobTab, setJobTab] = useState<"pending" | "approved" | "all">("pending");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const { data: pendingCount } = useQuery({
    queryKey: ["pending-jobs-count"],
    queryFn: async () => {
      const { count } = await supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_approved", false).eq("is_active", true);
      return count ?? 0;
    },
  });

  const { data: adminJobs, isLoading } = useQuery({
    queryKey: ["admin-jobs", jobTab],
    queryFn: async () => {
      let query = supabase.from("jobs").select("id, title, location, job_type, is_active, is_approved, created_at, description, tag, hide_apply, salary_min, salary_max, application_deadline, source_url, requirements, companies(name, logo_url, is_verified, phone, website), categories(name)").order("created_at", { ascending: false }).limit(50);
      if (jobTab === "pending") query = query.eq("is_approved", false).eq("is_active", true);
      if (jobTab === "approved") query = query.eq("is_approved", true);
      const { data } = await query;
      return (data as unknown as AdminJob[]) ?? [];
    },
  });

  const refreshAll = () => {
    ["admin-jobs", "pending-jobs-count", "dashboard-stats"].forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
  };

  const sendNotification = async (userId: string, type: string, resourceId: string, title: string, message: string) => {
    try {
      await supabase.functions.invoke("notify", { body: { type, resource_id: resourceId, user_id: userId, title, message } });
    } catch (err) { console.error("Notification failed:", err); }
  };

  const handleApprove = async (jobId: string) => {
    const { error } = await supabase.from("jobs").update({ is_approved: true }).eq("id", jobId);
    if (error) { toast.error(error.message); return; }
    const job = adminJobs?.find(j => j.id === jobId);
    if (job) {
      const { data: comp } = await supabase.from("companies").select("user_id, name").eq("name", job.companies?.name ?? "").maybeSingle();
      if (comp?.user_id) {
        await sendNotification(comp.user_id, "job_approved", jobId, "✅ Job Approved!", `Your job "${job.title}" has been approved and is now live.`);
      }
    }
    toast.success("Job approved!"); refreshAll();
  };

  const handleReject = async (jobId: string) => {
    const job = adminJobs?.find(j => j.id === jobId);
    const { error } = await supabase.from("jobs").update({ is_active: false, is_approved: false }).eq("id", jobId);
    if (error) { toast.error(error.message); return; }
    // Notify employer about rejection
    if (job) {
      const { data: comp } = await supabase.from("companies").select("user_id, name").eq("name", job.companies?.name ?? "").maybeSingle();
      if (comp?.user_id) {
        await sendNotification(comp.user_id, "job_rejected", jobId, "❌ Job Not Approved", `Your job "${job.title}" was not approved. Please review and resubmit.`);
      }
    }
    toast.success("Job rejected"); refreshAll();
  };

  const handleTagChange = async (jobId: string, newTag: string) => {
    const tagValue = newTag === "none" ? null : newTag;
    const { error } = await supabase.from("jobs").update({ tag: tagValue }).eq("id", jobId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Tag updated to ${tagValue || "None"}`); refreshAll();
  };

  const handleToggleApply = async (jobId: string, currentHide: boolean) => {
    const { error } = await supabase.from("jobs").update({ hide_apply: !currentHide }).eq("id", jobId);
    if (error) { toast.error(error.message); return; }
    toast.success(!currentHide ? "আবেদন বাটন লুকানো হয়েছে" : "আবেদন বাটন দেখানো হয়েছে");
    refreshAll();
  };

  const handleDelete = async (jobId: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) { toast.error(error.message); return; }
    toast.success("Job permanently deleted");
    refreshAll();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Job Management</h1>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b p-4 overflow-x-auto">
          {(["pending", "approved", "all"] as const).map((t) => (
            <Button key={t} variant={jobTab === t ? "default" : "ghost"} size="sm" onClick={() => setJobTab(t)} className="capitalize shrink-0">
              {t} {t === "pending" && (pendingCount ?? 0) > 0 && <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{pendingCount}</Badge>}
            </Button>
          ))}
        </div>
        <div className="divide-y">
          {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : adminJobs && adminJobs.length > 0 ? adminJobs.map((job) => (
            <div key={job.id} className="p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{job.title}</h3>
                    {!job.is_approved && job.is_active && <Badge variant="outline" className="border-accent text-accent text-[10px]">Pending</Badge>}
                    {job.is_approved && <Badge variant="outline" className="border-success text-success text-[10px]">Live</Badge>}
                    {!job.is_active && <Badge variant="outline" className="border-destructive text-destructive text-[10px]">Rejected</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{job.companies?.name} · {job.location} · {job.job_type} · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <div className="flex items-center gap-1.5 rounded-md border px-2 py-1">
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Apply</span>
                    <Switch
                      checked={!job.hide_apply}
                      onCheckedChange={() => handleToggleApply(job.id, job.hide_apply)}
                      className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 data-[state=checked]:bg-primary data-[state=unchecked]:bg-destructive/50"
                    />
                  </div>
                  <Select value={job.tag || "none"} onValueChange={(v) => handleTagChange(job.id, v)}>
                    <SelectTrigger className="h-7 w-[90px] text-[10px]"><Tag className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Tag</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="Hot">Hot</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)} className="gap-1 text-xs">
                    <Eye className="h-3 w-3" /> {expandedJob === job.id ? "Hide" : "Preview"}
                  </Button>
                  {!job.is_approved && job.is_active && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(job.id)} className="gap-1 bg-success text-success-foreground hover:bg-success/90 text-xs"><Check className="h-3 w-3" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(job.id)} className="gap-1 border-destructive text-destructive text-xs"><X className="h-3 w-3" /> Reject</Button>
                    </>
                  )}
                  {job.is_approved && <Button size="sm" variant="ghost" onClick={() => handleReject(job.id)} className="gap-1 text-destructive text-xs"><X className="h-3 w-3" /> Deactivate</Button>}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-1 text-destructive text-xs"><Trash2 className="h-3 w-3" /> Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Permanently delete this job?</AlertDialogTitle>
                        <AlertDialogDescription>"{job.title}" will be permanently deleted. This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(job.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {expandedJob === job.id && (
                <div className="mt-3 rounded-xl bg-secondary/50 p-4 text-sm text-muted-foreground">{job.description}</div>
              )}
            </div>
          )) : <div className="p-8 text-center text-muted-foreground">{jobTab === "pending" ? "No pending jobs 🎉" : "No jobs found"}</div>}
        </div>
      </div>
    </div>
  );
};

export default DashboardJobs;
