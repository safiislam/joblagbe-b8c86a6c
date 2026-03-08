import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Shield, Users, Briefcase, Building2, BarChart3, Check, X, Clock,
  FileText, Eye, BookOpen, Plus, RefreshCw, TrendingUp
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AdminJob = {
  id: string; title: string; location: string; job_type: string;
  is_active: boolean; is_approved: boolean; created_at: string; description: string;
  companies: { name: string } | null;
};
type CompanyRow = { id: string; name: string; location: string | null; website: string | null; created_at: string; };
type ProfileRow = { id: string; full_name: string | null; role: string; phone: string | null; user_id: string; created_at: string; };
type ApplicationRow = { id: string; status: string; created_at: string; user_id: string; jobs: { title: string; companies: { name: string } | null } | null; };
type BlogRow = { id: string; title: string; slug: string; is_published: boolean; created_at: string; author_name: string; };

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [jobTab, setJobTab] = useState<"pending" | "approved" | "all">("pending");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [blogForm, setBlogForm] = useState({ title: "", slug: "", content: "", excerpt: "", author_name: "Job Lagbe Team" });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading, navigate]);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [jobs, companies, applications, pending, profiles] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_approved", false).eq("is_active", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return { jobs: jobs.count ?? 0, companies: companies.count ?? 0, applications: applications.count ?? 0, pending: pending.count ?? 0, users: profiles.count ?? 0 };
    },
    enabled: isAdmin,
  });

  const { data: adminJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["admin-jobs", jobTab],
    queryFn: async () => {
      let query = supabase.from("jobs").select("id, title, location, job_type, is_active, is_approved, created_at, description, companies(name)").order("created_at", { ascending: false }).limit(50);
      if (jobTab === "pending") query = query.eq("is_approved", false).eq("is_active", true);
      if (jobTab === "approved") query = query.eq("is_approved", true);
      const { data } = await query;
      return (data as unknown as AdminJob[]) ?? [];
    },
    enabled: isAdmin,
  });

  const { data: companies } = useQuery({ queryKey: ["admin-companies"], queryFn: async () => { const { data } = await supabase.from("companies").select("id, name, location, website, created_at").order("created_at", { ascending: false }).limit(50); return (data as CompanyRow[]) ?? []; }, enabled: isAdmin });
  const { data: profiles } = useQuery({ queryKey: ["admin-profiles"], queryFn: async () => { const { data } = await supabase.from("profiles").select("id, full_name, role, phone, user_id, created_at").order("created_at", { ascending: false }).limit(50); return (data as ProfileRow[]) ?? []; }, enabled: isAdmin });
  const { data: recentApps } = useQuery({ queryKey: ["admin-applications"], queryFn: async () => { const { data } = await supabase.from("applications").select("id, status, created_at, user_id, jobs(title, companies(name))").order("created_at", { ascending: false }).limit(20); return (data as unknown as ApplicationRow[]) ?? []; }, enabled: isAdmin });
  const { data: blogPosts } = useQuery({ queryKey: ["admin-blogs"], queryFn: async () => { const { data } = await supabase.from("blog_posts").select("id, title, slug, is_published, created_at, author_name").order("created_at", { ascending: false }); return (data as BlogRow[]) ?? []; }, enabled: isAdmin });

  const refreshAll = () => {
    ["admin-stats", "admin-jobs", "admin-companies", "admin-profiles", "admin-applications", "admin-blogs", "jobs"].forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
  };

  const handleApprove = async (jobId: string) => {
    const { error } = await supabase.from("jobs").update({ is_approved: true }).eq("id", jobId);
    if (error) { toast.error(error.message); return; }
    toast.success("Job approved!"); refreshAll();
  };

  const handleReject = async (jobId: string) => {
    const { error } = await supabase.from("jobs").update({ is_active: false, is_approved: false }).eq("id", jobId);
    if (error) { toast.error(error.message); return; }
    toast.success("Job rejected"); refreshAll();
  };

  const handleCreateBlog = async () => {
    if (!blogForm.title || !blogForm.slug || !blogForm.content) { toast.error("Fill in title, slug, and content"); return; }
    const { error } = await supabase.from("blog_posts").insert({ ...blogForm, is_published: true });
    if (error) { toast.error(error.message); return; }
    toast.success("Blog post created!");
    setShowBlogForm(false);
    setBlogForm({ title: "", slug: "", content: "", excerpt: "", author_name: "Job Lagbe Team" });
    refreshAll();
  };

  const toggleBlogPublish = async (id: string, current: boolean) => {
    await supabase.from("blog_posts").update({ is_published: !current }).eq("id", id);
    refreshAll();
  };

  if (loading || !isAdmin) return null;

  const statCards = [
    { icon: Briefcase, label: "Total Jobs", value: stats?.jobs ?? 0, color: "text-primary", bg: "bg-primary/10" },
    { icon: Clock, label: "Pending", value: stats?.pending ?? 0, color: "text-accent", bg: "bg-accent/10" },
    { icon: Building2, label: "Companies", value: stats?.companies ?? 0, color: "text-success", bg: "bg-success/10" },
    { icon: Users, label: "Users", value: stats?.users ?? 0, color: "text-primary", bg: "bg-primary/10" },
    { icon: FileText, label: "Applications", value: stats?.applications ?? 0, color: "text-accent", bg: "bg-accent/10" },
  ];

  const seekers = profiles?.filter(p => p.role === "seeker").length ?? 0;
  const employers = profiles?.filter(p => p.role === "employer").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold md:text-2xl">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage Job Lagbe platform</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refreshAll} className="gap-2 self-start">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mb-6">
          {statCards.map((c) => (
            <div key={c.label} className="rounded-2xl border bg-card p-4 shadow-card">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg}`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <p className="mt-2 text-xl font-bold lg:text-2xl">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="jobs" className="gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Jobs
              {(stats?.pending ?? 0) > 0 && <Badge className="ml-1 bg-accent text-accent-foreground text-[10px] px-1.5 py-0">{stats?.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="companies" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Companies</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Users</TabsTrigger>
            <TabsTrigger value="applications" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Applications</TabsTrigger>
            <TabsTrigger value="blog" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Blog</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
          </TabsList>

          {/* JOBS TAB */}
          <TabsContent value="jobs">
            <div className="rounded-2xl border bg-card shadow-card">
              <div className="flex items-center gap-2 border-b p-4 overflow-x-auto">
                {(["pending", "approved", "all"] as const).map((t) => (
                  <Button key={t} variant={jobTab === t ? "default" : "ghost"} size="sm" onClick={() => setJobTab(t)} className="capitalize shrink-0">
                    {t} {t === "pending" && (stats?.pending ?? 0) > 0 && <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{stats?.pending}</Badge>}
                  </Button>
                ))}
              </div>
              <div className="divide-y">
                {jobsLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : adminJobs && adminJobs.length > 0 ? adminJobs.map((job) => (
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
                      <div className="flex items-center gap-2 shrink-0">
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
                      </div>
                    </div>
                    {expandedJob === job.id && (
                      <div className="mt-3 rounded-xl bg-secondary/50 p-4 text-sm text-muted-foreground animate-fade-in" style={{ animationDuration: "0.2s" }}>{job.description}</div>
                    )}
                  </div>
                )) : <div className="p-8 text-center text-muted-foreground">{jobTab === "pending" ? "No pending jobs 🎉" : "No jobs found"}</div>}
              </div>
            </div>
          </TabsContent>

          {/* COMPANIES TAB */}
          <TabsContent value="companies">
            <div className="rounded-2xl border bg-card shadow-card">
              <div className="border-b p-4"><h2 className="font-bold">Registered Companies ({companies?.length ?? 0})</h2></div>
              <div className="divide-y">
                {companies && companies.length > 0 ? companies.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.location || "No location"} · Joined {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                    </div>
                    {c.website && <a href={c.website} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">Website</a>}
                  </div>
                )) : <div className="p-8 text-center text-muted-foreground">No companies yet</div>}
              </div>
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users">
            <div className="rounded-2xl border bg-card shadow-card">
              <div className="border-b p-4"><h2 className="font-bold">Users ({profiles?.length ?? 0})</h2></div>
              <div className="divide-y">
                {profiles && profiles.length > 0 ? profiles.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-sm">{p.full_name || "No name"}</p>
                      <p className="text-xs text-muted-foreground">{p.phone || "No phone"} · Joined {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
                    </div>
                    <Badge variant="outline" className={p.role === "employer" ? "border-accent text-accent" : "border-primary text-primary"}>{p.role}</Badge>
                  </div>
                )) : <div className="p-8 text-center text-muted-foreground">No users yet</div>}
              </div>
            </div>
          </TabsContent>

          {/* APPLICATIONS TAB */}
          <TabsContent value="applications">
            <div className="rounded-2xl border bg-card shadow-card">
              <div className="border-b p-4"><h2 className="font-bold">Recent Applications ({recentApps?.length ?? 0})</h2></div>
              <div className="divide-y">
                {recentApps && recentApps.length > 0 ? recentApps.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-sm">{app.jobs?.title ?? "Unknown Job"}</p>
                      <p className="text-xs text-muted-foreground">{app.jobs?.companies?.name} · {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</p>
                    </div>
                    <Badge variant="outline" className={app.status === "accepted" ? "border-success text-success" : app.status === "rejected" ? "border-destructive text-destructive" : "border-accent text-accent"}>{app.status}</Badge>
                  </div>
                )) : <div className="p-8 text-center text-muted-foreground">No applications yet</div>}
              </div>
            </div>
          </TabsContent>

          {/* BLOG TAB */}
          <TabsContent value="blog">
            <div className="rounded-2xl border bg-card shadow-card">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="font-bold">Blog Posts ({blogPosts?.length ?? 0})</h2>
                <Button size="sm" onClick={() => setShowBlogForm(!showBlogForm)} className="gap-1 bg-accent text-accent-foreground">
                  <Plus className="h-3.5 w-3.5" /> New Post
                </Button>
              </div>
              {showBlogForm && (
                <div className="border-b p-4 space-y-3 bg-secondary/30">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div><Label>Title</Label><Input value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} className="mt-1 rounded-xl" placeholder="ক্যারিয়ার টিপস: ইন্টারভিউ প্রস্তুতি" /></div>
                    <div><Label>Slug (URL)</Label><Input value={blogForm.slug} onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} className="mt-1 rounded-xl" placeholder="career-tips-interview" /></div>
                  </div>
                  <div><Label>Excerpt</Label><Input value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} className="mt-1 rounded-xl" placeholder="Short description..." /></div>
                  <div><Label>Content (Markdown)</Label><Textarea value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} rows={8} className="mt-1 rounded-xl font-mono text-sm" placeholder="Write your blog content in Markdown..." /></div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateBlog} className="bg-success text-success-foreground">Publish</Button>
                    <Button variant="ghost" onClick={() => setShowBlogForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}
              <div className="divide-y">
                {blogPosts && blogPosts.length > 0 ? blogPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-sm">{post.title}</p>
                      <p className="text-xs text-muted-foreground">{post.author_name} · /{post.slug} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={post.is_published ? "border-success text-success" : "border-muted-foreground text-muted-foreground"}>
                        {post.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => toggleBlogPublish(post.id, post.is_published)} className="text-xs">
                        {post.is_published ? "Unpublish" : "Publish"}
                      </Button>
                    </div>
                  </div>
                )) : <div className="p-8 text-center text-muted-foreground">No blog posts yet. Create your first post!</div>}
              </div>
            </div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border bg-card p-6 shadow-card">
                <h3 className="text-sm font-medium text-muted-foreground">Platform Overview</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-sm">Total Jobs</span><span className="font-bold text-primary">{stats?.jobs ?? 0}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm">Active Jobs</span><span className="font-bold text-success">{(stats?.jobs ?? 0) - (stats?.pending ?? 0)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm">Pending Review</span><span className="font-bold text-accent">{stats?.pending ?? 0}</span></div>
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-6 shadow-card">
                <h3 className="text-sm font-medium text-muted-foreground">User Breakdown</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-sm">Total Users</span><span className="font-bold">{stats?.users ?? 0}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm">Job Seekers</span><span className="font-bold text-primary">{seekers}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm">Employers</span><span className="font-bold text-accent">{employers}</span></div>
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-6 shadow-card">
                <h3 className="text-sm font-medium text-muted-foreground">Engagement</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-sm">Applications</span><span className="font-bold text-primary">{stats?.applications ?? 0}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm">Companies</span><span className="font-bold text-success">{stats?.companies ?? 0}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm">Blog Posts</span><span className="font-bold">{blogPosts?.length ?? 0}</span></div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
