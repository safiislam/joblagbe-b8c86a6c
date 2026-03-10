import { Briefcase, Building2, Users, FileText, Clock, GraduationCap, BookMarked, BookOpen, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DashboardOverview = () => {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [jobs, companies, applications, pending, profiles, courses, ebooks, blogs, pendingCourses, serviceOrders, contacts] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_approved", false).eq("is_active", true),
        supabase.from("profiles").select("id, role"),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("ebooks").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("service_orders").select("id", { count: "exact", head: true }),
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }),
      ]);
      const seekers = profiles.data?.filter(p => p.role === "seeker").length ?? 0;
      const employers = profiles.data?.filter(p => p.role === "employer").length ?? 0;
      return {
        jobs: jobs.count ?? 0, companies: companies.count ?? 0, applications: applications.count ?? 0,
        pending: pending.count ?? 0, users: profiles.data?.length ?? 0, seekers, employers,
        courses: courses.count ?? 0, ebooks: ebooks.count ?? 0, blogs: blogs.count ?? 0,
        pendingCourses: pendingCourses.count ?? 0, serviceOrders: serviceOrders.count ?? 0,
        contacts: contacts.count ?? 0,
      };
    },
  });

  const statCards = [
    { icon: Briefcase, label: "Total Jobs", value: stats?.jobs ?? 0, color: "text-primary", bg: "bg-primary/10" },
    { icon: Clock, label: "Pending Jobs", value: stats?.pending ?? 0, color: "text-accent", bg: "bg-accent/10" },
    { icon: Building2, label: "Companies", value: stats?.companies ?? 0, color: "text-success", bg: "bg-success/10" },
    { icon: Users, label: "Total Users", value: stats?.users ?? 0, color: "text-primary", bg: "bg-primary/10" },
    { icon: FileText, label: "Applications", value: stats?.applications ?? 0, color: "text-accent", bg: "bg-accent/10" },
    { icon: GraduationCap, label: "Courses", value: stats?.courses ?? 0, color: "text-success", bg: "bg-success/10" },
    { icon: BookMarked, label: "E-Books", value: stats?.ebooks ?? 0, color: "text-primary", bg: "bg-primary/10" },
    { icon: BookOpen, label: "Blog Posts", value: stats?.blogs ?? 0, color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">Welcome to Job Lagbe Admin Panel</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg}`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className="mt-2 text-xl font-bold lg:text-2xl">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Quick stats panels */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Platform Overview
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm">Active Jobs</span><span className="font-bold text-success">{(stats?.jobs ?? 0) - (stats?.pending ?? 0)}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm">Pending Review</span><span className="font-bold text-accent">{stats?.pending ?? 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm">Pending Courses</span><span className="font-bold text-accent">{stats?.pendingCourses ?? 0}</span></div>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" /> User Breakdown
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm">Total Users</span><span className="font-bold">{stats?.users ?? 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm">Job Seekers</span><span className="font-bold text-primary">{stats?.seekers ?? 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm">Employers</span><span className="font-bold text-accent">{stats?.employers ?? 0}</span></div>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" /> Leads & Orders
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm">Service Orders</span><span className="font-bold text-primary">{stats?.serviceOrders ?? 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm">Contact Leads</span><span className="font-bold text-success">{stats?.contacts ?? 0}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
