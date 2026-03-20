import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle, XCircle, BadgeCheck, Clock, Search, Building2,
  MapPin, Phone, Globe, FileText, ChevronDown, ChevronUp,
  Briefcase, Trash2, Eye, Shield, ShieldOff
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const DashboardCompanies = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: companies, isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, location, website, is_verified, created_at, phone, trade_license, logo_url, description, user_id")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  // Fetch job counts per company
  const { data: jobCounts } = useQuery({
    queryKey: ["admin-company-job-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("company_id");
      const counts: Record<string, number> = {};
      data?.forEach((j: any) => {
        counts[j.company_id] = (counts[j.company_id] || 0) + 1;
      });
      return counts;
    },
  });

  const { data: verificationRequests } = useQuery({
    queryKey: ["admin-verification-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("verification_requests")
        .select("*, companies(name, logo_url)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const sendNotification = async (userId: string, type: string, resourceId: string, title: string, message: string) => {
    try {
      await supabase.functions.invoke("notify", { body: { type, resource_id: resourceId, user_id: userId, title, message } });
    } catch (err) { console.error("Notification failed:", err); }
  };

  const handleVerification = useMutation({
    mutationFn: async ({ requestId, companyId, approve, userId }: { requestId: string; companyId: string; approve: boolean; userId: string }) => {
      const { error: reqErr } = await supabase
        .from("verification_requests")
        .update({ status: approve ? "approved" : "rejected", updated_at: new Date().toISOString() })
        .eq("id", requestId);
      if (reqErr) throw reqErr;

      if (approve) {
        const { error: compErr } = await supabase.from("companies").update({ is_verified: true }).eq("id", companyId);
        if (compErr) throw compErr;
      }

      const req = verificationRequests?.find((r: any) => r.id === requestId);
      const companyName = req?.companies?.name || "Your company";
      if (approve) {
        await sendNotification(userId, "verification_approved", companyId, "🛡️ Company Verified!", `Congratulations! "${companyName}" is now verified.`);
      } else {
        await sendNotification(userId, "verification_rejected", companyId, "⚠️ Verification Rejected", `Verification for "${companyName}" was not approved.`);
      }
    },
    onSuccess: (_, { approve }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-verification-requests"] });
      toast.success(approve ? "কোম্পানি ভেরিফাই করা হয়েছে" : "অনুরোধ প্রত্যাখ্যান করা হয়েছে");
    },
    onError: () => toast.error("Failed to update"),
  });

  const toggleVerification = useMutation({
    mutationFn: async ({ companyId, verified }: { companyId: string; verified: boolean }) => {
      const { error } = await supabase.from("companies").update({ is_verified: verified }).eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      toast.success("আপডেট হয়েছে");
    },
  });

  const deleteCompany = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-company-job-counts"] });
      toast.success("কোম্পানি ডিলিট হয়েছে");
    },
    onError: () => toast.error("ডিলিট করতে সমস্যা হয়েছে"),
  });

  const filtered = companies?.filter((c: any) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "verified" && c.is_verified) || (filter === "unverified" && !c.is_verified);
    return matchSearch && matchFilter;
  }) ?? [];

  const totalCompanies = companies?.length ?? 0;
  const verifiedCount = companies?.filter((c: any) => c.is_verified).length ?? 0;
  const unverifiedCount = totalCompanies - verifiedCount;

  const stats = [
    { label: "মোট কোম্পানি", value: totalCompanies, icon: Building2, color: "text-foreground" },
    { label: "ভেরিফাইড", value: verifiedCount, icon: BadgeCheck, color: "text-primary" },
    { label: "আনভেরিফাইড", value: unverifiedCount, icon: ShieldOff, color: "text-muted-foreground" },
    { label: "পেন্ডিং রিকুয়েস্ট", value: verificationRequests?.length ?? 0, icon: Clock, color: "text-accent-foreground" },
  ];

  const filters: { label: string; value: "all" | "verified" | "unverified" }[] = [
    { label: "সব", value: "all" },
    { label: "ভেরিফাইড", value: "verified" },
    { label: "আনভেরিফাইড", value: "unverified" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">কোম্পানি ম্যানেজমেন্ট</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending Verification Requests */}
      {verificationRequests && verificationRequests.length > 0 && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 shadow-sm">
          <div className="border-b border-accent/20 p-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent-foreground" />
            <h2 className="font-bold text-sm">পেন্ডিং ভেরিফিকেশন রিকুয়েস্ট ({verificationRequests.length})</h2>
          </div>
          <div className="divide-y divide-amber-200/30">
            {verificationRequests.map((req: any) => (
              <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  {req.companies?.logo_url ? (
                    <img src={req.companies.logo_url} alt="" className="h-9 w-9 rounded-lg object-cover border" />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{req.companies?.name ?? "Unknown"}</p>
                    {req.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{req.message}</p>}
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground"
                    disabled={handleVerification.isPending}
                    onClick={() => handleVerification.mutate({ requestId: req.id, companyId: req.company_id, approve: true, userId: req.user_id })}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                    disabled={handleVerification.isPending}
                    onClick={() => handleVerification.mutate({ requestId: req.id, companyId: req.company_id, approve: false, userId: req.user_id })}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="কোম্পানি খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              onClick={() => setFilter(f.value)}
              className="text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Company List */}
      <div className="rounded-xl border bg-card shadow-sm divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">লোড হচ্ছে...</div>
        ) : filtered.length > 0 ? filtered.map((c: any) => {
          const isExpanded = expandedId === c.id;
          const jobs = jobCounts?.[c.id] ?? 0;

          return (
            <div key={c.id}>
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover border shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      {c.is_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      {c.location && (
                        <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.location}</span>
                      )}
                      <span className="flex items-center gap-0.5"><Briefcase className="h-3 w-3" />{jobs} জব</span>
                      <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={c.is_verified ? "default" : "secondary"} className="text-[10px]">
                    {c.is_verified ? "Verified" : "Unverified"}
                  </Badge>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{c.phone || "ফোন নেই"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.website ? (
                          <a href={c.website} target="_blank" rel="noopener" className="text-primary hover:underline truncate">{c.website}</a>
                        ) : <span className="text-muted-foreground">ওয়েবসাইট নেই</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{c.trade_license ? `ট্রেড লাইসেন্স: ${c.trade_license}` : "ট্রেড লাইসেন্স নেই"}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>মোট জব পোস্ট: {jobs}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>যোগদান: {format(new Date(c.created_at), "dd MMM yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{c.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/companies/${c.id}`}>
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        <Eye className="h-3.5 w-3.5" /> প্রোফাইল দেখুন
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant={c.is_verified ? "outline" : "default"}
                      className="gap-1 text-xs"
                      onClick={(e) => { e.stopPropagation(); toggleVerification.mutate({ companyId: c.id, verified: !c.is_verified }); }}
                    >
                      {c.is_verified ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                      {c.is_verified ? "ভেরিফাই সরান" : "ভেরিফাই করুন"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("এই কোম্পানি ডিলিট করতে চান?")) deleteCompany.mutate(c.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> ডিলিট
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="p-8 text-center text-muted-foreground">কোনো কোম্পানি পাওয়া যায়নি</div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-right">দেখানো হচ্ছে {filtered.length} / {totalCompanies}</p>
    </div>
  );
};

export default DashboardCompanies;
