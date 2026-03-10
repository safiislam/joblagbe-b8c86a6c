import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const DashboardCompanies = () => {
  const { data: companies } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name, location, website, created_at").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Companies ({companies?.length ?? 0})</h1>
      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {companies && companies.length > 0 ? companies.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-sm">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.location || "No location"} · Joined {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
            </div>
            {c.website && <a href={c.website} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">Website</a>}
          </div>
        )) : <div className="p-8 text-center text-muted-foreground">No companies yet</div>}
      </div>
    </div>
  );
};

export default DashboardCompanies;
