import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

const DashboardServiceOrders = () => {
  const { data: orders } = useQuery({
    queryKey: ["admin-service-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("service_orders").select("*").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Service Orders ({orders?.length ?? 0})</h1>
      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {orders && orders.length > 0 ? orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-sm">{o.name}</p>
              <p className="text-xs text-muted-foreground">{o.service_type} · {o.email || o.phone || "—"} · {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}</p>
              {o.details && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{o.details}</p>}
            </div>
            <Badge variant="outline" className={o.status === "completed" ? "border-success text-success" : "border-accent text-accent"}>{o.status}</Badge>
          </div>
        )) : <div className="p-8 text-center text-muted-foreground">No service orders yet</div>}
      </div>
    </div>
  );
};

export default DashboardServiceOrders;
