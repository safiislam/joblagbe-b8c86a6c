import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, ImagePlus, Loader2, Megaphone, GripVertical } from "lucide-react";

type PopupBanner = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

type FormState = {
  title: string;
  description: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  is_active: boolean;
  sort_order: number;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  image_url: "",
  cta_text: "বিস্তারিত দেখুন",
  cta_link: "",
  is_active: true,
  sort_order: 0,
};

const DashboardPopups = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-popup-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popup_banners")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as PopupBanner[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Title is required");
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        cta_text: form.cta_text.trim() || "বিস্তারিত দেখুন",
        cta_link: form.cta_link.trim() || null,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };

      if (editing) {
        const { error } = await supabase.from("popup_banners").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("popup_banners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Popup updated!" : "Popup created!");
      queryClient.invalidateQueries({ queryKey: ["admin-popup-banners"] });
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("popup_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Popup deleted!");
      queryClient.invalidateQueries({ queryKey: ["admin-popup-banners"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("popup_banners").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-popup-banners"] }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("popup-banners").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("popup-banners").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  const startEdit = (b: PopupBanner) => {
    setEditing(b.id);
    setForm({
      title: b.title,
      description: b.description || "",
      image_url: b.image_url || "",
      cta_text: b.cta_text || "বিস্তারিত দেখুন",
      cta_link: b.cta_link || "",
      is_active: b.is_active,
      sort_order: b.sort_order,
    });
  };

  const showForm = editing !== null || editing === "new";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" /> Popup Banners
        </h2>
        {!showForm && (
          <Button onClick={() => { setEditing("new"); setForm(emptyForm); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Popup
          </Button>
        )}
      </div>

      {/* Form */}
      {(editing === "new" || editing) && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold">{editing === "new" ? "New Popup Banner" : "Edit Popup Banner"}</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="প্রমোশন শিরোনাম" />
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="বিস্তারিত বর্ণনা..." rows={3} />
          </div>

          {/* Image upload */}
          <div className="space-y-1.5">
            <Label>Banner Image</Label>
            {form.image_url ? (
              <div className="relative rounded-lg overflow-hidden border max-w-sm">
                <img src={form.image_url} alt="Preview" className="w-full aspect-[16/10] object-cover" />
                <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => setForm((f) => ({ ...f, image_url: "" }))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 transition-colors">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload image"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>CTA Button Text</Label>
              <Input value={form.cta_text} onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))} placeholder="বিস্তারিত দেখুন" />
            </div>
            <div className="space-y-1.5">
              <Label>CTA Link (URL)</Label>
              <Input value={form.cta_link} onChange={(e) => setForm((f) => ({ ...f, cta_link: e.target.value }))} placeholder="https://..." />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            <Label>Active</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editing === "new" ? "Create" : "Update"}
            </Button>
            <Button variant="outline" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : banners.length === 0 && !editing ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          No popup banners yet. Click "Add Popup" to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:shadow-card transition-shadow">
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              {b.image_url ? (
                <img src={b.image_url} alt="" className="h-14 w-20 rounded-lg object-cover border shrink-0" />
              ) : (
                <div className="h-14 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Megaphone className="h-5 w-5 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{b.title}</span>
                  <Badge variant={b.is_active ? "default" : "secondary"} className="text-[10px] shrink-0">
                    {b.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {b.cta_link && <p className="text-xs text-muted-foreground truncate">{b.cta_link}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch
                  checked={b.is_active}
                  onCheckedChange={(v) => toggleActive.mutate({ id: b.id, is_active: v })}
                  className="scale-75"
                />
                <Button size="sm" variant="ghost" onClick={() => startEdit(b)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                  if (confirm("Delete this popup?")) deleteMutation.mutate(b.id);
                }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPopups;
