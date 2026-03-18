import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, CheckCircle2, XCircle, ShoppingBag } from "lucide-react";

const statusConfig: Record<string, { label: string; labelBn: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", labelBn: "অপেক্ষমান", color: "bg-warning/15 text-warning border-warning/20", icon: Clock },
  in_progress: { label: "In Progress", labelBn: "চলমান", color: "bg-primary/15 text-primary border-primary/20", icon: Package },
  completed: { label: "Completed", labelBn: "সম্পন্ন", color: "bg-success/15 text-success border-success/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", labelBn: "বাতিল", color: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle },
};

const MyServiceOrders = () => {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-service-orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-2xl border bg-card shadow-card">
        <div className="flex flex-col items-center py-14 text-muted-foreground">
          <ShoppingBag className="mb-3 h-10 w-10 opacity-30" />
          <p className="font-medium">কোনো সার্ভিস অর্ডার নেই</p>
          <p className="mt-1 text-sm">আপনি এখনো কোনো সার্ভিস অর্ডার করেননি</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card shadow-card divide-y">
      {orders.map((order) => {
        const cfg = statusConfig[order.status] || statusConfig.pending;
        const Icon = cfg.icon;
        return (
          <div key={order.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">{order.service_type}</h3>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 gap-1 ${cfg.color}`}>
                    <Icon className="h-3 w-3" />
                    {cfg.labelBn}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>নাম: {order.name}</span>
                  {order.phone && <span>📞 {order.phone}</span>}
                  <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            {order.details && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 whitespace-pre-wrap">
                {order.details}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MyServiceOrders;
