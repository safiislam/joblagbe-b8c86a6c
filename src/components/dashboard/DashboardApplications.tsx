import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

const DashboardApplications = () => {
  const { data: apps } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("id, status, created_at, user_id, jobs(title, companies(name))").order("created_at", { ascending: false }).limit(50);
      return (data as any[]) ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Applications ({apps?.length ?? 0})</h1>
      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {apps && apps.length > 0 ? apps.map((app: any) => (
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
  );
};

export default DashboardApplications;
