import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Shield, Users, Briefcase, Building2, BarChart3, Check, X, Clock,
  FileText, Eye, BookOpen, Plus, RefreshCw, TrendingUp, BookMarked, GraduationCap, Trash2, Edit
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
import { Switch } from "@/components/ui/switch";

type AdminJob = {
  id: string; title: string; location: string; job_type: string;
  is_active: boolean; is_approved: boolean; created_at: string; description: string;
  companies: { name: string } | null;
};
type CompanyRow = { id: string; name: string; location: string | null; website: string | null; created_at: string; };
type ProfileRow = { id: string; full_name: string | null; role: string; phone: string | null; user_id: string; created_at: string; };
type ApplicationRow = { id: string; status: string; created_at: string; user_id: string; jobs: { title: string; companies: { name: string } | null } | null; };
type BlogRow = { id: string; title: string; slug: string; is_published: boolean; created_at: string; author_name: string; };
type CourseRow = { id: string; title: string; category: string; provider: string | null; duration: string | null; is_free: boolean; price: number | null; link: string | null; description: string | null; is_approved?: boolean; user_id?: string | null; };
type EbookRow = { id: string; title: string; category: string; author: string | null; pages: number | null; is_free: boolean; price: number | null; download_url: string | null; description: string | null; };

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [jobTab, setJobTab] = useState<"pending" | "approved" | "all">("pending");
  const [courseTab, setCourseTab] = useState<"pending" | "approved" | "all">("all");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [blogForm, setBlogForm] = useState({ title: "", slug: "", content: "", excerpt: "", author_name: "Job Lagbe Team" });
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", category: "", provider: "", duration: "", is_free: true, price: 0, link: "" });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [showEbookForm, setShowEbookForm] = useState(false);
  const [ebookForm, setEbookForm] = useState({ title: "", description: "", category: "", author: "", pages: 0, is_free: true, price: 0, download_url: "" });
  const [editingEbookId, setEditingEbookId] = useState<string | null>(null);

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
  const { data: courses } = useQuery({ queryKey: ["admin-courses"], queryFn: async () => { const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false }); return (data as CourseRow[]) ?? []; }, enabled: isAdmin });
  const { data: ebooks } = useQuery({ queryKey: ["admin-ebooks"], queryFn: async () => { const { data } = await supabase.from("ebooks").select("*").order("created_at", { ascending: false }); return (data as EbookRow[]) ?? []; }, enabled: isAdmin });

  const refreshAll = () => {
    ["admin-stats", "admin-jobs", "admin-companies", "admin-profiles", "admin-applications", "admin-blogs", "admin-courses", "admin-ebooks", "jobs", "all-courses", "all-ebooks"].forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
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

  // Course CRUD
  const handleSaveCourse = async () => {
    if (!courseForm.title || !courseForm.category) { toast.error("Title and category are required"); return; }
    const payload = { ...courseForm, price: courseForm.is_free ? 0 : courseForm.price };
    if (editingCourseId) {
      const { error } = await supabase.from("courses").update(payload).eq("id", editingCourseId);
      if (error) { toast.error(error.message); return; }
      toast.success("Course updated!");
    } else {
      const { error } = await supabase.from("courses").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Course created!");
    }
    setShowCourseForm(false);
    setEditingCourseId(null);
    setCourseForm({ title: "", description: "", category: "", provider: "", duration: "", is_free: true, price: 0, link: "" });
    refreshAll();
  };

  const handleEditCourse = (c: CourseRow) => {
    setCourseForm({ title: c.title, description: c.description ?? "", category: c.category, provider: c.provider ?? "", duration: c.duration ?? "", is_free: c.is_free, price: c.price ?? 0, link: c.link ?? "" });
    setEditingCourseId(c.id);
    setShowCourseForm(true);
  };

  const handleDeleteCourse = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Course deleted"); refreshAll();
  };

  // Ebook CRUD
  const handleSaveEbook = async () => {
    if (!ebookForm.title || !ebookForm.category) { toast.error("Title and category are required"); return; }
    const payload = { ...ebookForm, price: ebookForm.is_free ? 0 : ebookForm.price, pages: ebookForm.pages || null };
    if (editingEbookId) {
      const { error } = await supabase.from("ebooks").update(payload).eq("id", editingEbookId);
      if (error) { toast.error(error.message); return; }
      toast.success("Ebook updated!");
    } else {
      const { error } = await supabase.from("ebooks").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Ebook created!");
    }
    setShowEbookForm(false);
    setEditingEbookId(null);
    setEbookForm({ title: "", description: "", category: "", author: "", pages: 0, is_free: true, price: 0, download_url: "" });
    refreshAll();
  };

  const handleEditEbook = (e: EbookRow) => {
    setEbookForm({ title: e.title, description: e.description ?? "", category: e.category, author: e.author ?? "", pages: e.pages ?? 0, is_free: e.is_free, price: e.price ?? 0, download_url: e.download_url ?? "" });
    setEditingEbookId(e.id);
    setShowEbookForm(true);
  };

  const handleDeleteEbook = async (id: string) => {
    const { error } = await supabase.from("ebooks").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Ebook deleted"); refreshAll();
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
            <TabsTrigger value="courses" className="gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Courses</TabsTrigger>
            <TabsTrigger value="ebooks" className="gap-1.5"><BookMarked className="h-3.5 w-3.5" /> E-Books</TabsTrigger>
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

          {/* COURSES TAB */}
          <TabsContent value="courses">
            <div className="rounded-2xl border bg-card shadow-card">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="font-bold">Courses ({courses?.length ?? 0})</h2>
                <Button size="sm" onClick={() => { setShowCourseForm(!showCourseForm); setEditingCourseId(null); setCourseForm({ title: "", description: "", category: "", provider: "", duration: "", is_free: true, price: 0, link: "" }); }} className="gap-1 bg-accent text-accent-foreground">
                  <Plus className="h-3.5 w-3.5" /> New Course
                </Button>
              </div>
              {showCourseForm && (
                <div className="border-b p-4 space-y-3 bg-secondary/30">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div><Label>Title *</Label><Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="mt-1 rounded-xl" placeholder="কোর্সের নাম" /></div>
                    <div><Label>Category *</Label><Input value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} className="mt-1 rounded-xl" placeholder="আইটি, ডিজাইন, ব্যবসা..." /></div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div><Label>Provider</Label><Input value={courseForm.provider} onChange={(e) => setCourseForm({ ...courseForm, provider: e.target.value })} className="mt-1 rounded-xl" placeholder="JobLagbe Academy" /></div>
                    <div><Label>Duration</Label><Input value={courseForm.duration} onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} className="mt-1 rounded-xl" placeholder="৪ সপ্তাহ" /></div>
                    <div><Label>Link</Label><Input value={courseForm.link} onChange={(e) => setCourseForm({ ...courseForm, link: e.target.value })} className="mt-1 rounded-xl" placeholder="https://..." /></div>
                  </div>
                  <div><Label>Description</Label><Textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} rows={3} className="mt-1 rounded-xl" placeholder="কোর্সের বিবরণ..." /></div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={courseForm.is_free} onCheckedChange={(v) => setCourseForm({ ...courseForm, is_free: v })} />
                      <Label>ফ্রি</Label>
                    </div>
                    {!courseForm.is_free && (
                      <div><Label>Price (৳)</Label><Input type="number" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })} className="mt-1 w-32 rounded-xl" /></div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveCourse} className="bg-success text-success-foreground">{editingCourseId ? "Update" : "Create"}</Button>
                    <Button variant="ghost" onClick={() => { setShowCourseForm(false); setEditingCourseId(null); }}>Cancel</Button>
                  </div>
                </div>
              )}
              <div className="divide-y">
                {courses && courses.length > 0 ? courses.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{c.title}</p>
                        <Badge variant={c.is_free ? "default" : "outline"} className="text-[10px]">{c.is_free ? "ফ্রি" : `৳${c.price}`}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.category} · {c.provider ?? "—"} · {c.duration ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCourse(c)} className="text-xs gap-1"><Edit className="h-3 w-3" /> Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCourse(c.id)} className="text-xs gap-1 text-destructive"><Trash2 className="h-3 w-3" /> Delete</Button>
                    </div>
                  </div>
                )) : <div className="p-8 text-center text-muted-foreground">No courses yet</div>}
              </div>
            </div>
          </TabsContent>

          {/* EBOOKS TAB */}
          <TabsContent value="ebooks">
            <div className="rounded-2xl border bg-card shadow-card">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="font-bold">E-Books ({ebooks?.length ?? 0})</h2>
                <Button size="sm" onClick={() => { setShowEbookForm(!showEbookForm); setEditingEbookId(null); setEbookForm({ title: "", description: "", category: "", author: "", pages: 0, is_free: true, price: 0, download_url: "" }); }} className="gap-1 bg-accent text-accent-foreground">
                  <Plus className="h-3.5 w-3.5" /> New E-Book
                </Button>
              </div>
              {showEbookForm && (
                <div className="border-b p-4 space-y-3 bg-secondary/30">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div><Label>Title *</Label><Input value={ebookForm.title} onChange={(e) => setEbookForm({ ...ebookForm, title: e.target.value })} className="mt-1 rounded-xl" placeholder="ই-বইয়ের নাম" /></div>
                    <div><Label>Category *</Label><Input value={ebookForm.category} onChange={(e) => setEbookForm({ ...ebookForm, category: e.target.value })} className="mt-1 rounded-xl" placeholder="চাকরি প্রস্তুতি, ফ্রিল্যান্সিং..." /></div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div><Label>Author</Label><Input value={ebookForm.author} onChange={(e) => setEbookForm({ ...ebookForm, author: e.target.value })} className="mt-1 rounded-xl" placeholder="JobLagbe Team" /></div>
                    <div><Label>Pages</Label><Input type="number" value={ebookForm.pages || ""} onChange={(e) => setEbookForm({ ...ebookForm, pages: Number(e.target.value) })} className="mt-1 rounded-xl" placeholder="120" /></div>
                    <div><Label>Download URL</Label><Input value={ebookForm.download_url} onChange={(e) => setEbookForm({ ...ebookForm, download_url: e.target.value })} className="mt-1 rounded-xl" placeholder="https://..." /></div>
                  </div>
                  <div><Label>Description</Label><Textarea value={ebookForm.description} onChange={(e) => setEbookForm({ ...ebookForm, description: e.target.value })} rows={3} className="mt-1 rounded-xl" placeholder="ই-বইয়ের বিবরণ..." /></div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={ebookForm.is_free} onCheckedChange={(v) => setEbookForm({ ...ebookForm, is_free: v })} />
                      <Label>ফ্রি</Label>
                    </div>
                    {!ebookForm.is_free && (
                      <div><Label>Price (৳)</Label><Input type="number" value={ebookForm.price} onChange={(e) => setEbookForm({ ...ebookForm, price: Number(e.target.value) })} className="mt-1 w-32 rounded-xl" /></div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEbook} className="bg-success text-success-foreground">{editingEbookId ? "Update" : "Create"}</Button>
                    <Button variant="ghost" onClick={() => { setShowEbookForm(false); setEditingEbookId(null); }}>Cancel</Button>
                  </div>
                </div>
              )}
              <div className="divide-y">
                {ebooks && ebooks.length > 0 ? ebooks.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{e.title}</p>
                        <Badge variant={e.is_free ? "default" : "outline"} className="text-[10px]">{e.is_free ? "ফ্রি" : `৳${e.price}`}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{e.category} · {e.author ?? "—"} · {e.pages ? `${e.pages} পৃষ্ঠা` : "—"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditEbook(e)} className="text-xs gap-1"><Edit className="h-3 w-3" /> Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEbook(e.id)} className="text-xs gap-1 text-destructive"><Trash2 className="h-3 w-3" /> Delete</Button>
                    </div>
                  </div>
                )) : <div className="p-8 text-center text-muted-foreground">No ebooks yet</div>}
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
                <h3 className="text-sm font-medium text-muted-foreground">Content</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-sm">Courses</span><span className="font-bold text-primary">{courses?.length ?? 0}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm">E-Books</span><span className="font-bold text-success">{ebooks?.length ?? 0}</span></div>
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
