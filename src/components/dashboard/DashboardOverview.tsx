import { Briefcase, Building2, Users, FileText, Clock, GraduationCap, BookMarked, BookOpen, TrendingUp, ArrowUpRight, UserPlus, Send, ShoppingBag, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { format, subDays, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--muted-foreground))"];

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

  // Fetch recent signups (last 7 days)
  const { data: recentSignups } = useQuery({
    queryKey: ["dashboard-recent-signups"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: true });

      const grouped: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const day = format(subDays(new Date(), i), "MMM dd");
        grouped[day] = 0;
      }
      data?.forEach((p) => {
        const day = format(new Date(p.created_at), "MMM dd");
        if (grouped[day] !== undefined) grouped[day]++;
      });
      return Object.entries(grouped).map(([name, users]) => ({ name, users }));
    },
  });

  // Fetch recent applications (last 7 days)
  const { data: recentApps } = useQuery({
    queryKey: ["dashboard-recent-apps"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data } = await supabase
        .from("applications")
        .select("created_at")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: true });

      const grouped: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const day = format(subDays(new Date(), i), "MMM dd");
        grouped[day] = 0;
      }
      data?.forEach((a) => {
        const day = format(new Date(a.created_at), "MMM dd");
        if (grouped[day] !== undefined) grouped[day]++;
      });
      return Object.entries(grouped).map(([name, apps]) => ({ name, apps }));
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

  const userPieData = [
    { name: "Seekers", value: stats?.seekers ?? 0 },
    { name: "Employers", value: stats?.employers ?? 0 },
  ];

  const contentPieData = [
    { name: "Jobs", value: stats?.jobs ?? 0 },
    { name: "Courses", value: stats?.courses ?? 0 },
    { name: "E-Books", value: stats?.ebooks ?? 0 },
    { name: "Blogs", value: stats?.blogs ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">Welcome to Job Lagbe Admin Panel</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg}`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-xl font-bold lg:text-2xl">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Signups - Area Chart */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> New Signups (Last 7 Days)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentSignups ?? []}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#signupGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Applications - Bar Chart */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" /> Applications (Last 7 Days)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentApps ?? []}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="apps" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pie Charts + Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* User Breakdown Pie */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" /> User Breakdown
          </h3>
          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={userPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                  {userPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Seekers ({stats?.seekers ?? 0})</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> Employers ({stats?.employers ?? 0})</span>
          </div>
        </div>

        {/* Content Breakdown Pie */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Content Breakdown
          </h3>
          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={contentPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                  {contentPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            {contentPieData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Platform Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm">Active Jobs</span><span className="font-bold text-success">{(stats?.jobs ?? 0) - (stats?.pending ?? 0)}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm">Pending Jobs</span><span className="font-bold text-accent">{stats?.pending ?? 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm">Pending Courses</span><span className="font-bold text-accent">{stats?.pendingCourses ?? 0}</span></div>
            <hr className="border-border" />
            <div className="flex items-center justify-between"><span className="text-sm">Service Orders</span><span className="font-bold text-primary">{stats?.serviceOrders ?? 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm">Contact Leads</span><span className="font-bold text-success">{stats?.contacts ?? 0}</span></div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <RecentActivityFeed />
    </div>
  );
};

const activityIcon: Record<string, { icon: typeof UserPlus; color: string; bg: string }> = {
  signup: { icon: UserPlus, color: "text-success", bg: "bg-success/10" },
  application: { icon: Send, color: "text-primary", bg: "bg-primary/10" },
  job_post: { icon: Briefcase, color: "text-accent", bg: "bg-accent/10" },
  service_order: { icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10" },
  contact: { icon: MessageSquare, color: "text-success", bg: "bg-success/10" },
};

const RecentActivityFeed = () => {
  const { data: feed } = useQuery({
    queryKey: ["dashboard-activity-feed"],
    queryFn: async () => {
      const [recentProfiles, recentApplications, recentJobs, recentOrders, recentContacts] = await Promise.all([
        supabase.from("profiles").select("full_name, role, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("applications").select("id, created_at, job_id, jobs(title)").order("created_at", { ascending: false }).limit(5),
        supabase.from("jobs").select("title, created_at, companies(name)").order("created_at", { ascending: false }).limit(5),
        supabase.from("service_orders").select("name, service_type, created_at, status").order("created_at", { ascending: false }).limit(5),
        supabase.from("contact_submissions").select("name, subject, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      type FeedItem = { type: string; text: string; time: string; badge?: string };
      const items: FeedItem[] = [];

      recentProfiles.data?.forEach((p) => items.push({
        type: "signup", text: `${p.full_name || "New user"} signed up as ${p.role}`, time: p.created_at,
      }));
      recentApplications.data?.forEach((a: any) => items.push({
        type: "application", text: `New application for "${a.jobs?.title || "a job"}"`, time: a.created_at,
      }));
      recentJobs.data?.forEach((j: any) => items.push({
        type: "job_post", text: `"${j.title}" posted by ${j.companies?.name || "a company"}`, time: j.created_at,
      }));
      recentOrders.data?.forEach((o) => items.push({
        type: "service_order", text: `${o.name} ordered ${o.service_type}`, time: o.created_at, badge: o.status,
      }));
      recentContacts.data?.forEach((c) => items.push({
        type: "contact", text: `${c.name}: ${c.subject || "New message"}`, time: c.created_at,
      }));

      return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);
    },
    refetchInterval: 30000, // refresh every 30s
  });

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Recent Activity
        </h3>
        <Link to="/dashboard/activity" className="text-xs text-primary hover:underline">View All</Link>
      </div>
      <div className="divide-y max-h-[420px] overflow-y-auto">
        {feed && feed.length > 0 ? feed.map((item, i) => {
          const config = activityIcon[item.type] || activityIcon.signup;
          const Icon = config.icon;
          return (
            <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-tight truncate">{item.text}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                  </span>
                  {item.badge && <Badge variant="outline" className="text-[10px] h-4">{item.badge}</Badge>}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="p-8 text-center text-sm text-muted-foreground">No recent activity</div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
