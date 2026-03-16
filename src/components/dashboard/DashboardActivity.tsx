import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format, subDays, subHours, isAfter } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  MousePointerClick,
  Clock,
  Globe,
  LogIn,
  UserPlus,
  FileText,
  Eye,
  Send,
  Trash2,
  Settings,
  RefreshCw,
} from "lucide-react";

const ACTION_ICONS: Record<string, typeof Activity> = {
  login: LogIn,
  signup: UserPlus,
  page_view: Eye,
  application: FileText,
  contact: Send,
  delete: Trash2,
  settings: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  login: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  signup: "bg-blue-500/10 text-blue-600 border-blue-200",
  page_view: "bg-violet-500/10 text-violet-600 border-violet-200",
  application: "bg-amber-500/10 text-amber-600 border-amber-200",
  contact: "bg-pink-500/10 text-pink-600 border-pink-200",
};

const PAGE_SIZE = 25;

const DashboardActivity = () => {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [page, setPage] = useState(0);

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-map"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, phone");
      const map: Record<string, { full_name: string | null; phone: string | null }> = {};
      (data ?? []).forEach((p) => { map[p.user_id] = { full_name: p.full_name, phone: p.phone }; });
      return map;
    },
  });

  // Unique action types for filter
  const actionTypes = useMemo(() => {
    if (!activities) return [];
    const set = new Set(activities.map((a) => a.action));
    return Array.from(set).sort();
  }, [activities]);

  // Filtered data
  const filtered = useMemo(() => {
    if (!activities) return [];
    let list = activities;

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date();
      const cutoff =
        timeFilter === "1h" ? subHours(now, 1)
        : timeFilter === "24h" ? subDays(now, 1)
        : timeFilter === "7d" ? subDays(now, 7)
        : subDays(now, 30);
      list = list.filter((a) => isAfter(new Date(a.created_at), cutoff));
    }

    // Action filter
    if (actionFilter !== "all") {
      list = list.filter((a) => a.action === actionFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => {
        const userName = a.user_id ? profiles?.[a.user_id]?.full_name?.toLowerCase() : "";
        return (
          a.action.toLowerCase().includes(q) ||
          (a.resource_type?.toLowerCase() || "").includes(q) ||
          (a.resource_id?.toLowerCase() || "").includes(q) ||
          (a.ip_address?.toLowerCase() || "").includes(q) ||
          (userName || "").includes(q)
        );
      });
    }

    return list;
  }, [activities, search, actionFilter, timeFilter, profiles]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Stats
  const stats = useMemo(() => {
    if (!activities) return { total: 0, today: 0, uniqueUsers: 0, uniqueIPs: 0 };
    const todayCutoff = subDays(new Date(), 1);
    const todayCount = activities.filter((a) => isAfter(new Date(a.created_at), todayCutoff)).length;
    const userSet = new Set(activities.filter((a) => a.user_id).map((a) => a.user_id));
    const ipSet = new Set(activities.filter((a) => a.ip_address).map((a) => a.ip_address));
    return { total: activities.length, today: todayCount, uniqueUsers: userSet.size, uniqueIPs: ipSet.size };
  }, [activities]);

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action] || Activity;
    return Icon;
  };

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action] || "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            User Activity
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor all platform interactions and user behavior</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: stats.total, icon: MousePointerClick, color: "text-primary" },
          { label: "Last 24 Hours", value: stats.today, icon: Clock, color: "text-emerald-600" },
          { label: "Unique Users", value: stats.uniqueUsers, icon: Users, color: "text-blue-600" },
          { label: "Unique IPs", value: stats.uniqueIPs, icon: Globe, color: "text-violet-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className={`rounded-lg bg-muted p-2.5 ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, action, IP, resource..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timeFilter} onValueChange={(v) => { setTimeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} events
        </p>
      </div>

      {/* Activity List */}
      <div className="rounded-xl border bg-card shadow-sm divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading activity...</div>
        ) : pageData.length > 0 ? (
          pageData.map((a) => {
            const Icon = getActionIcon(a.action);
            const colorClass = getActionColor(a.action);
            const profile = a.user_id ? profiles?.[a.user_id] : null;
            return (
              <div key={a.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                <div className={`rounded-lg p-2 border shrink-0 mt-0.5 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[11px] font-medium">
                      {a.action}
                    </Badge>
                    {a.resource_type && (
                      <span className="text-xs text-muted-foreground">
                        → {a.resource_type}
                        {a.resource_id && (
                          <span className="font-mono text-[10px] ml-1 opacity-60">
                            #{a.resource_id.slice(0, 8)}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {profile?.full_name && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {profile.full_name}
                      </span>
                    )}
                    {!profile?.full_name && a.user_id && (
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Users className="h-3 w-3" />
                        {a.user_id.slice(0, 8)}…
                      </span>
                    )}
                    {a.ip_address && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {a.ip_address}
                      </span>
                    )}
                    <span className="flex items-center gap-1" title={format(new Date(a.created_at), "PPpp")}>
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {/* Metadata */}
                  {a.metadata && typeof a.metadata === "object" && Object.keys(a.metadata as Record<string, unknown>).length > 0 && (
                    <div className="mt-1.5 text-[11px] font-mono bg-muted/50 rounded-md px-2 py-1 text-muted-foreground max-w-full overflow-x-auto">
                      {Object.entries(a.metadata as Record<string, unknown>).map(([k, v]) => (
                        <span key={k} className="mr-3">
                          <span className="text-foreground/60">{k}:</span> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {search || actionFilter !== "all" || timeFilter !== "all"
              ? "No activity matching your filters"
              : "No activity logs yet"}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardActivity;
