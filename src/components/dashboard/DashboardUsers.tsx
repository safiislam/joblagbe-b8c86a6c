import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

const DashboardUsers = () => {
  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, role, phone, user_id, created_at").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const seekers = profiles?.filter(p => p.role === "seeker").length ?? 0;
  const employers = profiles?.filter(p => p.role === "employer").length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Users ({profiles?.length ?? 0})</h1>
        <Badge variant="outline" className="border-primary text-primary">Seekers: {seekers}</Badge>
        <Badge variant="outline" className="border-accent text-accent">Employers: {employers}</Badge>
      </div>
      <div className="rounded-2xl border bg-card shadow-sm divide-y">
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
  );
};

export default DashboardUsers;
