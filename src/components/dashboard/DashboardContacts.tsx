import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const DashboardContacts = () => {
  const { data: contacts } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const { data } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Contact Leads ({contacts?.length ?? 0})</h1>
      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {contacts && contacts.length > 0 ? contacts.map((c) => (
          <div key={c.id} className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{c.name}</p>
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
            </div>
            <p className="text-xs text-muted-foreground">{c.email || "—"} · {c.phone || "—"} {c.subject && `· ${c.subject}`}</p>
            <p className="text-sm mt-1 text-muted-foreground line-clamp-3">{c.message}</p>
          </div>
        )) : <div className="p-8 text-center text-muted-foreground">No contact submissions yet</div>}
      </div>
    </div>
  );
};

export default DashboardContacts;
