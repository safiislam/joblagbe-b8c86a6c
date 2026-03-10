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
import { Plus, Check, X, Edit, Trash2 } from "lucide-react";

const DashboardCourses = () => {
  const queryClient = useQueryClient();
  const [courseTab, setCourseTab] = useState<"all" | "pending" | "approved">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "", provider: "", duration: "", is_free: true, price: 0, link: "" });

  const { data: courses } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-courses"] });

  const sendNotification = async (userId: string, type: string, resourceId: string, title: string, message: string) => {
    try {
      await supabase.functions.invoke("notify", { body: { type, resource_id: resourceId, user_id: userId, title, message } });
    } catch (err) { console.error(err); }
  };

  const handleApprove = async (id: string) => {
    const course = courses?.find(c => c.id === id);
    const { error } = await supabase.from("courses").update({ is_approved: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (course?.user_id) {
      await sendNotification(course.user_id, "course_approved", id, "✅ Course Approved!", `Your course "${course.title}" has been approved.`);
    }
    toast.success("Course approved!"); refresh();
  };

  const handleReject = async (id: string) => {
    const course = courses?.find(c => c.id === id);
    const { error } = await supabase.from("courses").update({ is_approved: false }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (course?.user_id) {
      await sendNotification(course.user_id, "course_rejected", id, "❌ Course Not Approved", `Your course "${course.title}" was not approved.`);
    }
    toast.success("Course rejected"); refresh();
  };

  const handleSave = async () => {
    if (!form.title || !form.category) { toast.error("Title and category required"); return; }
    const payload = { ...form, price: form.is_free ? 0 : form.price, is_approved: true };
    if (editingId) {
      const { error } = await supabase.from("courses").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Course updated!");
    } else {
      const { error } = await supabase.from("courses").insert(payload as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Course created!");
    }
    setShowForm(false); setEditingId(null);
    setForm({ title: "", description: "", category: "", provider: "", duration: "", is_free: true, price: 0, link: "" });
    refresh();
  };

  const handleEdit = (c: any) => {
    setForm({ title: c.title, description: c.description ?? "", category: c.category, provider: c.provider ?? "", duration: c.duration ?? "", is_free: c.is_free, price: c.price ?? 0, link: c.link ?? "" });
    setEditingId(c.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Course deleted"); refresh();
  };

  const filtered = courses?.filter(c => courseTab === "all" ? true : courseTab === "pending" ? !c.is_approved : c.is_approved);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Courses ({courses?.length ?? 0})</h1>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: "", description: "", category: "", provider: "", duration: "", is_free: true, price: 0, link: "" }); }} className="gap-1 bg-accent text-accent-foreground">
          <Plus className="h-3.5 w-3.5" /> New Course
        </Button>
      </div>

      <div className="flex gap-1">
        {(["all", "pending", "approved"] as const).map((t) => (
          <Button key={t} variant={courseTab === t ? "default" : "ghost"} size="sm" onClick={() => setCourseTab(t)} className="capitalize text-xs">
            {t} {t === "pending" && (courses?.filter(c => !c.is_approved).length ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{courses?.filter(c => !c.is_approved).length}</Badge>
            )}
          </Button>
        ))}
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-card p-4 space-y-3 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><Label>Category *</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 rounded-xl" /></div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label>Provider</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><Label>Link</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="mt-1 rounded-xl" /></div>
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
        {filtered && filtered.length > 0 ? filtered.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{c.title}</p>
                <Badge variant={c.is_free ? "default" : "outline"} className="text-[10px]">{c.is_free ? "ফ্রি" : `৳${c.price}`}</Badge>
                <Badge variant="outline" className={c.is_approved ? "border-success text-success text-[10px]" : "border-accent text-accent text-[10px]"}>
                  {c.is_approved ? "Approved" : "Pending"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{c.category} · {c.provider ?? "—"} · {c.duration ?? "—"}</p>
            </div>
            <div className="flex items-center gap-1">
              {!c.is_approved && <Button size="sm" onClick={() => handleApprove(c.id)} className="gap-1 bg-success text-success-foreground hover:bg-success/90 text-xs"><Check className="h-3 w-3" /> Approve</Button>}
              {c.is_approved && <Button size="sm" variant="ghost" onClick={() => handleReject(c.id)} className="gap-1 text-destructive text-xs"><X className="h-3 w-3" /> Unapprove</Button>}
              <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} className="text-xs gap-1"><Edit className="h-3 w-3" /> Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-xs gap-1 text-destructive"><Trash2 className="h-3 w-3" /> Delete</Button>
            </div>
          </div>
        )) : <div className="p-8 text-center text-muted-foreground">{courseTab === "pending" ? "No pending courses 🎉" : "No courses yet"}</div>}
      </div>
    </div>
  );
};

export default DashboardCourses;
