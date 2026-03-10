import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2 } from "lucide-react";

const DashboardEbooks = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "", author: "", pages: 0, is_free: true, price: 0, download_url: "" });

  const { data: ebooks } = useQuery({
    queryKey: ["admin-ebooks"],
    queryFn: async () => {
      const { data } = await supabase.from("ebooks").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-ebooks"] });

  const handleSave = async () => {
    if (!form.title || !form.category) { toast.error("Title and category required"); return; }
    const payload = { ...form, price: form.is_free ? 0 : form.price, pages: form.pages || null };
    if (editingId) {
      const { error } = await supabase.from("ebooks").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Ebook updated!");
    } else {
      const { error } = await supabase.from("ebooks").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Ebook created!");
    }
    setShowForm(false); setEditingId(null);
    setForm({ title: "", description: "", category: "", author: "", pages: 0, is_free: true, price: 0, download_url: "" });
    refresh();
  };

  const handleEdit = (e: any) => {
    setForm({ title: e.title, description: e.description ?? "", category: e.category, author: e.author ?? "", pages: e.pages ?? 0, is_free: e.is_free, price: e.price ?? 0, download_url: e.download_url ?? "" });
    setEditingId(e.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("ebooks").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Ebook deleted"); refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">E-Books ({ebooks?.length ?? 0})</h1>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: "", description: "", category: "", author: "", pages: 0, is_free: true, price: 0, download_url: "" }); }} className="gap-1 bg-accent text-accent-foreground">
          <Plus className="h-3.5 w-3.5" /> New E-Book
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-card p-4 space-y-3 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><Label>Category *</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 rounded-xl" /></div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><Label>Pages</Label><Input type="number" value={form.pages || ""} onChange={(e) => setForm({ ...form, pages: Number(e.target.value) })} className="mt-1 rounded-xl" /></div>
            <div><Label>Download URL</Label><Input value={form.download_url} onChange={(e) => setForm({ ...form, download_url: e.target.value })} className="mt-1 rounded-xl" /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 rounded-xl" /></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} /><Label>ফ্রি</Label></div>
            {!form.is_free && <div><Label>Price (৳)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1 w-32 rounded-xl" /></div>}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="bg-success text-success-foreground">{editingId ? "Update" : "Create"}</Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {ebooks && ebooks.length > 0 ? ebooks.map((e) => (
          <div key={e.id} className="flex items-center justify-between p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{e.title}</p>
                <Badge variant={e.is_free ? "default" : "outline"} className="text-[10px]">{e.is_free ? "ফ্রি" : `৳${e.price}`}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{e.category} · {e.author ?? "—"} · {e.pages ? `${e.pages} পৃষ্ঠা` : "—"}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(e)} className="text-xs gap-1"><Edit className="h-3 w-3" /> Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)} className="text-xs gap-1 text-destructive"><Trash2 className="h-3 w-3" /> Delete</Button>
            </div>
          </div>
        )) : <div className="p-8 text-center text-muted-foreground">No ebooks yet</div>}
      </div>
    </div>
  );
};

export default DashboardEbooks;
