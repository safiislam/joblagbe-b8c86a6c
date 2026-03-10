import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

const DashboardActivity = () => {
  const { data: activities } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const { data } = await supabase.from("user_activity").select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">User Activity ({activities?.length ?? 0})</h1>
      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {activities && activities.length > 0 ? activities.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{a.action}</Badge>
                {a.resource_type && <span className="text-xs text-muted-foreground">{a.resource_type}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {a.ip_address && `IP: ${a.ip_address} · `}
                {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        )) : <div className="p-8 text-center text-muted-foreground">No activity logs yet</div>}
      </div>
    </div>
  );
};

export default DashboardActivity;
