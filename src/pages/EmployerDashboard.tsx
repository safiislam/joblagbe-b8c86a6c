import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Users, Clock, CheckCircle, Eye, XCircle, UserCheck, FileText, Upload, Building2, Ban, Loader2, BadgeCheck, ShieldCheck, Save, ShoppingBag } from "lucide-react";
import MyServiceOrders from "@/components/MyServiceOrders";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


type EmployerJob = {
  id: string; title: string; location: string; job_type: string;
  is_active: boolean; is_approved: boolean; created_at: string;
};

type ApplicationRow = {
  id: string; status: string; created_at: string; cover_letter: string | null; user_id: string;
  profiles: { full_name: string | null; resume_url: string | null } | null;
};

const CompanyEditForm = ({ company, queryClient }: { company: any; queryClient: any }) => {
  const [form, setForm] = useState({
    name: company.name || "",
    phone: company.phone || "",
    website: company.website || "",
    location: company.location || "",
    description: company.description || "",
    trade_license: company.trade_license || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("কোম্পানির নাম আবশ্যক"); return; }
    setSaving(true);
    const { error } = await supabase.from("companies").update({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
    }).eq("id", company.id);
    setSaving(false);
    if (error) { toast.error("আপডেট করতে সমস্যা হয়েছে"); return; }
    toast.success("কোম্পানি তথ্য আপডেট হয়েছে!");
    queryClient.invalidateQueries({ queryKey: ["my-company"] });
  };

  return (
    <div className="rounded-2xl border bg-card shadow-card p-6 max-w-2xl space-y-4">
      <h2 className="font-bold text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> কোম্পানি তথ্য সম্পাদনা</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="co-name">কোম্পানির নাম *</Label>
          <Input id="co-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-phone">ফোন নম্বর</Label>
          <Input id="co-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+880..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-website">ওয়েবসাইট</Label>
          <Input id="co-website" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-location">অবস্থান</Label>
          <Input id="co-location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Dhaka, Bangladesh" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="co-desc">কোম্পানি বিবরণ</Label>
        <Textarea id="co-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="আপনার কোম্পানি সম্পর্কে লিখুন..." />
      </div>
      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        সংরক্ষণ করুন
      </Button>
    </div>
  );
};

const EmployerDashboard = () => {
  const { user, profile, loading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);


  const [requestingVerify, setRequestingVerify] = useState(false);
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




  const { data: verificationStatus } = useQuery({
    queryKey: ["verification-status", company?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("verification_requests")
        .select("status")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!company,
  });

  const handleRequestVerification = async () => {
    if (!company || !user) return;
    setRequestingVerify(true);
    try {
      const { error } = await supabase.from("verification_requests").insert({
        company_id: company.id,
        user_id: user.id,
        message: `Verification request for ${company.name}`,
      });
      if (error) {
        if (error.code === "23505") toast.info("ভেরিফিকেশন অনুরোধ আগেই পাঠানো হয়েছে");
        else throw error;
      } else {
        toast.success("ভেরিফিকেশন অনুরোধ পাঠানো হয়েছে!");
        queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      }
    } catch (err: any) {
      toast.error(err.message || "অনুরোধ পাঠাতে সমস্যা হয়েছে");
    } finally {
      setRequestingVerify(false);
    }
  };


  const { data: applicants } = useQuery({
    queryKey: ["job-applicants", selectedJobId],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status, created_at, cover_letter, user_id")
        .eq("job_id", selectedJobId!);
      if (!data || data.length === 0) return [];
      const userIds = data.map(a => a.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, resume_url").in("user_id", userIds);
      const profileMap: Record<string, { full_name: string | null; resume_url: string | null }> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = { full_name: p.full_name, resume_url: p.resume_url }; });
      return data.map(a => ({ ...a, profiles: profileMap[a.user_id] || { full_name: null, resume_url: null } })) as ApplicationRow[];
    },
    enabled: !!selectedJobId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ appId, status, seekerUserId }: { appId: string; status: string; seekerUserId: string }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", appId);
      if (error) throw error;
      // Notify the seeker about status change
      const jobTitle = myJobs?.find(j => j.id === selectedJobId)?.title ?? "a job";
      const statusMessages: Record<string, { title: string; message: string }> = {
        shortlisted: { title: "⭐ You've been shortlisted!", message: `You were shortlisted for "${jobTitle}".` },
        accepted: { title: "🎉 Application Accepted!", message: `Congratulations! Your application for "${jobTitle}" has been accepted.` },
        rejected: { title: "Application Update", message: `Your application for "${jobTitle}" was not selected. Keep trying!` },
      };
      const notif = statusMessages[status];
      if (notif) {
        supabase.functions.invoke("notify", {
          body: { type: `application_${status}`, resource_id: appId, user_id: seekerUserId, ...notif },
        }).catch(console.error);
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["job-applicants", selectedJobId] });
      toast.success(`Application ${status}`);
    },
    onError: () => toast.error("Failed to update status"),
  });

  const endJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.from("jobs").update({ is_active: false }).eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-jobs", company?.id] });
      toast.success("Job ended — no more applications will be accepted");
    },
    onError: () => toast.error("Failed to end job"),
  });




  if (loading || !user) return null;

  const totalJobs = myJobs?.length ?? 0;
  const endedJobs = myJobs?.filter(j => !j.is_active).length ?? 0;
  const pendingJobs = myJobs?.filter(j => j.is_active && !j.is_approved).length ?? 0;
  const approvedJobs = myJobs?.filter(j => j.is_active && j.is_approved).length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 shrink-0 overflow-hidden">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-primary" />
                )}
              </div>
              <button
                onClick={async () => {
                  if (!company) return;
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    if (file.size > 300 * 1024) { toast.error("লোগো সর্বোচ্চ ৩০০KB হতে হবে"); return; }
                    const ext = file.name.split(".").pop();
                    const path = `${company.id}/logo.${ext}`;
                    const { error } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
                    if (error) { toast.error("Upload failed"); return; }
                    const publicUrl = supabase.storage.from("company-logos").getPublicUrl(path).data.publicUrl;
                    await supabase.from("companies").update({ logo_url: publicUrl + "?t=" + Date.now() }).eq("id", company.id);
                    queryClient.invalidateQueries({ queryKey: ["my-company"] });
                    toast.success("Logo updated!");
                  };
                  input.click();
                }}
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Upload className="h-5 w-5 text-white" />
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-bold inline-flex items-center gap-2">
                Employer Dashboard
                {company?.is_verified && <BadgeCheck className="h-5 w-5 text-primary" />}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{company?.name || "Set up your company to start posting"}</p>
            </div>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 font-semibold self-start" asChild>
            <Link to="/post-job"><Plus className="h-4 w-4" /> Post New Job</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          {[
            { label: "Total Jobs", value: totalJobs, icon: Briefcase, color: "text-primary" },
            { label: "Pending Approval", value: pendingJobs, icon: Clock, color: "text-accent" },
            { label: "Active", value: approvedJobs, icon: CheckCircle, color: "text-success" },
            { label: "Ended", value: endedJobs, icon: XCircle, color: "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-card">
              <s.icon className={`h-6 w-6 ${s.color}`} />
              <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Verification Request */}
        {company && !company.is_verified && (() => {
          const missing: string[] = [];
          if (!company.logo_url) missing.push("লোগো");
          if (!company.website) missing.push("ওয়েবসাইট");
          if (!company.phone) missing.push("ফোন নম্বর");
          if (!company.description) missing.push("কোম্পানি বিবরণ");
          if (!company.location) missing.push("অবস্থান");
          const canApply = missing.length === 0;

          return (
            <div className="mb-6 rounded-xl border bg-card p-4 space-y-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">কোম্পানি ভেরিফিকেশন</p>
                    <p className="text-xs text-muted-foreground">
                      {verificationStatus?.status === "pending"
                        ? "আপনার অনুরোধ পর্যালোচনা করা হচ্ছে"
                        : verificationStatus?.status === "rejected"
                        ? "আপনার অনুরোধ প্রত্যাখ্যান করা হয়েছে, পুনরায় চেষ্টা করুন"
                        : "ভেরিফাই ব্যাজ পেতে আবেদন করুন"}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 shrink-0"
                  disabled={requestingVerify || verificationStatus?.status === "pending" || !canApply}
                  onClick={handleRequestVerification}
                >
                  {requestingVerify ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                  {verificationStatus?.status === "pending" ? "অপেক্ষমান" : "ভেরিফিকেশন আবেদন"}
                </Button>
              </div>
              {!canApply && verificationStatus?.status !== "pending" && (
                <p className="text-xs text-destructive">
                  ⚠️ আবেদনের জন্য আপনার প্রোফাইলে যোগ করুন: {missing.join(", ")}
                </p>
              )}
            </div>
          );
        })()}

        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="jobs" className="gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Jobs</TabsTrigger>
             <TabsTrigger value="orders" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> Orders</TabsTrigger>
            <TabsTrigger value="company" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Company</TabsTrigger>
            <TabsTrigger value="company" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Company</TabsTrigger>
          </TabsList>

          {/* JOBS TAB */}
          <TabsContent value="jobs">
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <div className="rounded-2xl border bg-card shadow-card">
                  <div className="border-b p-4"><h2 className="font-bold text-lg">Your Jobs</h2></div>
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {myJobs && myJobs.length > 0 ? myJobs.map((job) => (
                      <div key={job.id} className={`p-4 transition-colors hover:bg-secondary/50 ${selectedJobId === job.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                        <button onClick={() => setSelectedJobId(job.id)} className="w-full text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm">{job.title}</h3>
                            {!job.is_active && <Badge variant="outline" className="border-destructive text-destructive text-[10px]">Ended</Badge>}
                            {job.is_active && !job.is_approved && <Badge variant="outline" className="border-accent text-accent text-[10px]">Pending</Badge>}
                            {job.is_active && job.is_approved && <Badge variant="outline" className="border-success text-success text-[10px]">Live</Badge>}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{job.location} · {job.job_type} · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</p>
                        </button>
                        {job.is_active && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground text-xs"
                            disabled={endJob.isPending}
                            onClick={() => {
                              if (confirm("Are you sure you want to end this job? No one will be able to apply anymore.")) {
                                endJob.mutate(job.id);
                              }
                            }}
                          >
                            <Ban className="h-3 w-3" /> End Job
                          </Button>
                        )}
                      </div>
                    )) : (
                      <div className="flex flex-col items-center py-10 text-muted-foreground">
                        <Briefcase className="mb-2 h-8 w-8 opacity-30" />
                        <p className="text-sm">No jobs posted yet</p>
                        <Button size="sm" className="mt-3 bg-accent text-accent-foreground" asChild><Link to="/post-job">Post Your First Job</Link></Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="rounded-2xl border bg-card shadow-card">
                  <div className="border-b p-4"><h2 className="font-bold text-lg">{selectedJobId ? "Applicants" : "Select a job to view applicants"}</h2></div>
                  <div className="divide-y">
                    {selectedJobId ? (
                      applicants && applicants.length > 0 ? applicants.map((app) => (
                        <div key={app.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">{app.profiles?.full_name || "Anonymous"}</p>
                              <p className="text-xs text-muted-foreground">Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</p>
                            </div>
                            <Badge variant="outline" className={app.status === "accepted" ? "border-success text-success" : app.status === "rejected" ? "border-destructive text-destructive" : app.status === "shortlisted" ? "border-primary text-primary" : "border-accent text-accent"}>{app.status}</Badge>
                          </div>
                          {app.cover_letter && <p className="mt-2 text-sm text-muted-foreground bg-secondary/50 rounded-xl p-3">{app.cover_letter}</p>}
                          {app.profiles?.resume_url && (
                            <a href={supabase.storage.from("resumes").getPublicUrl(app.profiles.resume_url).data.publicUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"><FileText className="h-3.5 w-3.5" /> View Resume</a>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {app.status !== "shortlisted" && (
                              <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary hover:bg-primary hover:text-primary-foreground" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ appId: app.id, status: "shortlisted", seekerUserId: app.user_id })}><UserCheck className="h-3.5 w-3.5" /> Shortlist</Button>
                            )}
                            {app.status !== "rejected" && (
                              <Button size="sm" variant="outline" className="gap-1.5 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ appId: app.id, status: "rejected", seekerUserId: app.user_id })}><XCircle className="h-3.5 w-3.5" /> Reject</Button>
                            )}
                          </div>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center py-14 text-muted-foreground"><Users className="mb-2 h-8 w-8 opacity-30" /><p className="text-sm">No applicants yet</p></div>
                      )
                    ) : (
                      <div className="flex flex-col items-center py-14 text-muted-foreground"><Eye className="mb-2 h-8 w-8 opacity-30" /><p className="text-sm">Click on a job to see who applied</p></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders">
            <MyServiceOrders />
          </TabsContent>





          {/* COMPANY TAB */}
          <TabsContent value="company">
            {company ? <CompanyEditForm company={company} queryClient={queryClient} /> : (
              <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
                No company found. Post a job to create your company profile.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployerDashboard;
