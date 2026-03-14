import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Users, Clock, CheckCircle, Eye, XCircle, UserCheck, FileText, GraduationCap, Upload, Building2, Ban, ImagePlus, Loader2, BadgeCheck, ShieldCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

type EmployerJob = {
  id: string; title: string; location: string; job_type: string;
  is_active: boolean; is_approved: boolean; created_at: string;
};

type ApplicationRow = {
  id: string; status: string; created_at: string; cover_letter: string | null; user_id: string;
  profiles: { full_name: string | null; resume_url: string | null } | null;
};

const EmployerDashboard = () => {
  const { user, profile, loading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", category: "", provider: "", duration: "", is_free: true, price: 0, discount_price: 0, link: "", thumbnail_url: "" });
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

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

  const { data: myCourses } = useQuery({
    queryKey: ["employer-courses", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

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

  const handleSubmitCourse = async () => {
    if (!courseForm.title || !courseForm.category) { toast.error("Title and category required"); return; }
    const { thumbnail_url, discount_price, ...rest } = courseForm;
    const { error } = await supabase.from("courses").insert({
      ...rest,
      price: courseForm.is_free ? 0 : courseForm.price,
      thumbnail_url: thumbnail_url || null,
      discount_price: courseForm.is_free ? null : (discount_price > 0 ? discount_price : null),
      user_id: user!.id,
      is_approved: false,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Course submitted for approval!");
    setShowCourseForm(false);
    setCourseForm({ title: "", description: "", category: "", provider: "", duration: "", is_free: true, price: 0, discount_price: 0, link: "", thumbnail_url: "" });
    queryClient.invalidateQueries({ queryKey: ["employer-courses"] });
  };

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
                    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
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
              <h1 className="text-2xl font-bold">Employer Dashboard</h1>
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
            { label: "Courses", value: myCourses?.length ?? 0, icon: GraduationCap, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-card">
              <s.icon className={`h-6 w-6 ${s.color}`} />
              <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="jobs" className="gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Jobs</TabsTrigger>
            <TabsTrigger value="courses" className="gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Courses</TabsTrigger>
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

          {/* COURSES TAB */}
          <TabsContent value="courses">
            <div className="rounded-2xl border bg-card shadow-card">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="font-bold">Your Courses ({myCourses?.length ?? 0})</h2>
                <Button size="sm" onClick={() => setShowCourseForm(!showCourseForm)} className="gap-1 bg-accent text-accent-foreground">
                  <Plus className="h-3.5 w-3.5" /> Submit Course
                </Button>
              </div>
              {showCourseForm && (
                <div className="border-b p-4 space-y-3 bg-secondary/30">
                  {/* Featured Image Upload */}
                  <div>
                    <Label>Featured Image</Label>
                    <div className="mt-1 flex items-center gap-3">
                      {courseForm.thumbnail_url ? (
                        <img src={courseForm.thumbnail_url} alt="Thumbnail" className="h-20 w-32 rounded-xl object-cover border" />
                      ) : (
                        <div className="flex h-20 w-32 items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-secondary">
                          <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingThumbnail}
                        className="gap-2 rounded-xl"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (!file || !user) return;
                            if (file.size > 3 * 1024 * 1024) { toast.error("Image must be under 3MB"); return; }
                            setUploadingThumbnail(true);
                            try {
                              const ext = file.name.split(".").pop();
                              const path = `${user.id}/${Date.now()}.${ext}`;
                              const { error } = await supabase.storage.from("course-images").upload(path, file);
                              if (error) throw error;
                              const publicUrl = supabase.storage.from("course-images").getPublicUrl(path).data.publicUrl;
                              setCourseForm(prev => ({ ...prev, thumbnail_url: publicUrl }));
                              toast.success("Image uploaded!");
                            } catch (err: any) {
                              toast.error(err.message || "Upload failed");
                            } finally {
                              setUploadingThumbnail(false);
                            }
                          };
                          input.click();
                        }}
                      >
                        {uploadingThumbnail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingThumbnail ? "Uploading..." : "Upload Image"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div><Label>Title *</Label><Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="mt-1 rounded-xl" placeholder="Course title" /></div>
                    <div><Label>Category *</Label><Input value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} className="mt-1 rounded-xl" placeholder="IT, Design, Business..." /></div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div><Label>Provider</Label><Input value={courseForm.provider} onChange={(e) => setCourseForm({ ...courseForm, provider: e.target.value })} className="mt-1 rounded-xl" placeholder="Academy name" /></div>
                    <div><Label>Duration</Label><Input value={courseForm.duration} onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} className="mt-1 rounded-xl" placeholder="4 weeks" /></div>
                    <div><Label>Link</Label><Input value={courseForm.link} onChange={(e) => setCourseForm({ ...courseForm, link: e.target.value })} className="mt-1 rounded-xl" placeholder="https://..." /></div>
                  </div>
                  <div><Label>Description</Label><Textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} rows={3} className="mt-1 rounded-xl" /></div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2"><Switch checked={courseForm.is_free} onCheckedChange={(v) => setCourseForm({ ...courseForm, is_free: v })} /><Label>Free</Label></div>
                    {!courseForm.is_free && (
                      <>
                        <div><Label>Price (৳)</Label><Input type="number" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })} className="mt-1 w-32 rounded-xl" /></div>
                        <div><Label>Discount Price (৳)</Label><Input type="number" value={courseForm.discount_price} onChange={(e) => setCourseForm({ ...courseForm, discount_price: Number(e.target.value) })} className="mt-1 w-32 rounded-xl" placeholder="Optional" /></div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSubmitCourse} className="bg-success text-success-foreground">Submit for Approval</Button>
                    <Button variant="ghost" onClick={() => setShowCourseForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}
              <div className="divide-y">
                {myCourses && myCourses.length > 0 ? myCourses.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{c.title}</p>
                        <Badge variant="outline" className={c.is_approved ? "border-success text-success text-[10px]" : "border-accent text-accent text-[10px]"}>
                          {c.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.category} · {c.provider ?? "—"}</p>
                    </div>
                  </div>
                )) : <div className="p-8 text-center text-muted-foreground">No courses submitted yet</div>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployerDashboard;
