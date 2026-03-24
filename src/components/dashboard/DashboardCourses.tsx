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
import { Plus, Check, X, Edit, Trash2, Eye, Search, Image } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DashboardCourses = () => {
  const queryClient = useQueryClient();
  const [courseTab, setCourseTab] = useState<"all" | "pending" | "approved">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewCourse, setPreviewCourse] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", description: "", category: "", provider: "", duration: "",
    is_free: true, price: 0, discount_price: 0, link: "", thumbnail_url: "",
    course_type: "online" as "online" | "offline",
  });

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
    const payload = {
      ...form,
      price: form.is_free ? 0 : form.price,
      discount_price: form.is_free ? null : (form.discount_price || null),
      thumbnail_url: form.thumbnail_url || null,
      course_type: form.course_type,
      is_approved: true,
    };
    if (editingId) {
      const { error } = await supabase.from("courses").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Course updated!");
    } else {
      const { error } = await supabase.from("courses").insert(payload as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Course created!");
    }
    resetForm();
    refresh();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", description: "", category: "", provider: "", duration: "", is_free: true, price: 0, discount_price: 0, link: "", thumbnail_url: "", course_type: "online" });
  };

  const handleEdit = (c: any) => {
    setForm({
      title: c.title,
      description: c.description ?? "",
      category: c.category,
      provider: c.provider ?? "",
      duration: c.duration ?? "",
      is_free: c.is_free,
      price: c.price ?? 0,
      discount_price: c.discount_price ?? 0,
      link: c.link ?? "",
      thumbnail_url: c.thumbnail_url ?? "",
      course_type: c.course_type ?? "online",
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Course deleted"); refresh();
  };

  const filtered = courses?.filter(c => {
    const matchTab = courseTab === "all" ? true : courseTab === "pending" ? !c.is_approved : c.is_approved;
    const matchSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Courses ({courses?.length ?? 0})</h1>
        <Button size="sm" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); else { resetForm(); setShowForm(true); } }} className="gap-1 bg-accent text-accent-foreground">
          <Plus className="h-3.5 w-3.5" /> New Course
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1">
          {(["all", "pending", "approved"] as const).map((t) => (
            <Button key={t} variant={courseTab === t ? "default" : "ghost"} size="sm" onClick={() => setCourseTab(t)} className="capitalize text-xs">
              {t} {t === "pending" && (courses?.filter(c => !c.is_approved).length ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{courses?.filter(c => !c.is_approved).length}</Badge>
              )}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-xs rounded-xl" />
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-card p-4 space-y-3 shadow-sm">
          <p className="font-semibold text-sm">{editingId ? "Edit Course" : "Create New Course"}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><Label>Category *</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 rounded-xl" /></div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>কোর্সের ধরন *</Label>
              <Select value={form.course_type} onValueChange={(v: "online" | "offline") => setForm({ ...form, course_type: v })}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">অনলাইন</SelectItem>
                  <SelectItem value="offline">অফলাইন</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label>Provider</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><Label>Link</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="mt-1 rounded-xl" /></div>
          </div>
          <div>
            <Label className="flex items-center gap-1"><Image className="h-3.5 w-3.5" /> Thumbnail URL</Label>
            <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://example.com/image.jpg" className="mt-1 rounded-xl" />
            {form.thumbnail_url && (
              <div className="mt-2 rounded-lg overflow-hidden border w-32 h-20">
                <img src={form.thumbnail_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 rounded-xl" /></div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2"><Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} /><Label>ফ্রি</Label></div>
            {!form.is_free && (
              <>
                <div>
                  <Label>মূল্য (৳)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1 w-32 rounded-xl" />
                </div>
                <div>
                  <Label>অফার মূল্য (৳)</Label>
                  <Input type="number" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: Number(e.target.value) })} placeholder="ঐচ্ছিক" className="mt-1 w-32 rounded-xl" />
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="bg-success text-success-foreground">{editingId ? "Update" : "Create"}</Button>
            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {filtered && filtered.length > 0 ? filtered.map((c) => (
          <div key={c.id} className="flex items-start gap-3 p-4">
            {/* Thumbnail */}
            <div className="hidden sm:flex h-14 w-20 shrink-0 rounded-lg overflow-hidden bg-muted items-center justify-center">
              {c.thumbnail_url ? (
                <img src={c.thumbnail_url} alt={c.title} className="h-full w-full object-cover" />
              ) : (
                <Image className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm truncate">{c.title}</p>
                <Badge variant={c.is_approved ? "default" : "outline"} className={`text-[10px] ${c.is_approved ? "bg-success/15 text-success border-success/20" : "border-accent text-accent"}`}>
                  {c.is_approved ? "Approved" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground">{c.category}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{c.provider ?? "—"}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{c.duration ?? "—"}</span>
                <span className="text-xs text-muted-foreground">·</span>
                {c.is_free ? (
                  <Badge variant="default" className="text-[10px]">ফ্রি</Badge>
                ) : (
                  <span className="text-xs font-medium">
                    {c.discount_price && Number(c.discount_price) < Number(c.price) ? (
                      <>
                        <span className="line-through text-muted-foreground">৳{c.price}</span>
                        {" "}
                        <span className="text-primary">৳{c.discount_price}</span>
                      </>
                    ) : (
                      <span>৳{c.price}</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 flex-wrap">
              <Button variant="ghost" size="sm" onClick={() => setPreviewCourse(c)} className="text-xs gap-1 h-7"><Eye className="h-3 w-3" /></Button>
              {!c.is_approved && <Button size="sm" onClick={() => handleApprove(c.id)} className="gap-1 bg-success text-success-foreground hover:bg-success/90 text-xs h-7"><Check className="h-3 w-3" /></Button>}
              {c.is_approved && <Button size="sm" variant="ghost" onClick={() => handleReject(c.id)} className="gap-1 text-destructive text-xs h-7"><X className="h-3 w-3" /></Button>}
              <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} className="text-xs gap-1 h-7"><Edit className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-xs gap-1 text-destructive h-7"><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        )) : <div className="p-8 text-center text-muted-foreground">{courseTab === "pending" ? "No pending courses 🎉" : "No courses yet"}</div>}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewCourse} onOpenChange={(open) => { if (!open) setPreviewCourse(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bangla">{previewCourse?.title}</DialogTitle>
          </DialogHeader>
          {previewCourse?.thumbnail_url && (
            <img src={previewCourse.thumbnail_url} alt={previewCourse.title} className="w-full h-40 object-cover rounded-lg" />
          )}
          <div className="space-y-2 text-sm">
            <p><strong>Category:</strong> {previewCourse?.category}</p>
            <p><strong>Provider:</strong> {previewCourse?.provider || "—"}</p>
            <p><strong>Duration:</strong> {previewCourse?.duration || "—"}</p>
            <p><strong>Price:</strong> {previewCourse?.is_free ? "ফ্রি" : (
              previewCourse?.discount_price && Number(previewCourse.discount_price) < Number(previewCourse.price)
                ? <><span className="line-through text-muted-foreground">৳{previewCourse.price}</span> <span className="text-primary font-bold">৳{previewCourse.discount_price}</span></>
                : `৳${previewCourse?.price}`
            )}</p>
            {previewCourse?.description && <p className="text-muted-foreground whitespace-pre-line">{previewCourse.description}</p>}
            {previewCourse?.link && <a href={previewCourse.link} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">View Link →</a>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardCourses;