import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const DashboardContacts = () => {
  const qc = useQueryClient();
  const { data: contacts } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const { data } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const deleteContact = async (id: string) => {
    if (!confirm("এই কন্টাক্ট লিড স্থায়ীভাবে মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("মুছে ফেলা হয়েছে"); qc.invalidateQueries({ queryKey: ["admin-contacts"] }); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Contact Leads ({contacts?.length ?? 0})</h1>
      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {contacts && contacts.length > 0 ? contacts.map((c) => (
          <div key={c.id} className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{c.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteContact(c.id)} title="স্থায়ীভাবে মুছুন">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
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
