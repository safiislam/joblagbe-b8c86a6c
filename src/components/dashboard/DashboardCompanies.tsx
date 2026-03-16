import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, BadgeCheck, Clock } from "lucide-react";
import { toast } from "sonner";

const DashboardCompanies = () => {
  const queryClient = useQueryClient();

  const { data: companies } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name, location, website, is_verified, created_at").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
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
        const { error: compErr } = await supabase
          .from("companies")
          .update({ is_verified: true })
          .eq("id", companyId);
        if (compErr) throw compErr;
      }

      // Notify employer about verification result
      const req = verificationRequests?.find((r: any) => r.id === requestId);
      const companyName = req?.companies?.name || "Your company";
      if (approve) {
        await sendNotification(userId, "verification_approved", companyId, "🛡️ Company Verified!", `Congratulations! "${companyName}" is now verified.`);
      } else {
        await sendNotification(userId, "verification_rejected", companyId, "⚠️ Verification Rejected", `Verification for "${companyName}" was not approved. Please update your profile and try again.`);
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
      toast.success("Updated");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Companies ({companies?.length ?? 0})</h1>

      {/* Pending Verification Requests */}
      {verificationRequests && verificationRequests.length > 0 && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 shadow-sm">
          <div className="border-b border-accent/20 p-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" />
            <h2 className="font-bold text-sm">Pending Verification Requests ({verificationRequests.length})</h2>
          </div>
          <div className="divide-y">
            {verificationRequests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-sm">{req.companies?.name ?? "Unknown"}</p>
                  {req.message && <p className="text-xs text-muted-foreground mt-0.5">{req.message}</p>}
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground"
                    disabled={handleVerification.isPending}
                    onClick={() => handleVerification.mutate({ requestId: req.id, companyId: req.company_id, approve: true })}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                    disabled={handleVerification.isPending}
                    onClick={() => handleVerification.mutate({ requestId: req.id, companyId: req.company_id, approve: false })}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Companies */}
      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {companies && companies.length > 0 ? companies.map((c: any) => (
          <div key={c.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm">{c.name}</p>
                  {c.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">{c.location || "No location"} · Joined {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={c.is_verified ? "outline" : "default"}
                className="text-xs gap-1"
                onClick={() => toggleVerification.mutate({ companyId: c.id, verified: !c.is_verified })}
              >
                <BadgeCheck className="h-3.5 w-3.5" />
                {c.is_verified ? "Remove Verify" : "Verify"}
              </Button>
              {c.website && <a href={c.website} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">Website</a>}
            </div>
          </div>
        )) : <div className="p-8 text-center text-muted-foreground">No companies yet</div>}
      </div>
    </div>
  );
};

export default DashboardCompanies;
