import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, BookMarked, Tablet, Search, Upload, Image, BookOpen, DollarSign, Eye } from "lucide-react";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  author: "",
  pages: 0,
  is_free: true,
  price: 0,
  discount_price: null as number | null,
  download_url: "",
  book_type: "ebook" as string,
  purchase_link: "",
  cover_image_url: "",
};

const DashboardEbooks = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: ebooks } = useQuery({
    queryKey: ["admin-ebooks"],
    queryFn: async () => {
      const { data } = await supabase.from("ebooks").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-ebooks"] });

  const filtered = ebooks?.filter((e: any) => {
    const matchSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.author && e.author.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType = filterType === "all" || (filterType === "ebook" ? (e.book_type === "ebook" || !e.book_type) : e.book_type === "hardcopy");
    return matchSearch && matchType;
  });

  const stats = {
    total: ebooks?.length ?? 0,
    ebook: ebooks?.filter((e: any) => e.book_type === "ebook" || !e.book_type).length ?? 0,
    hardcopy: ebooks?.filter((e: any) => e.book_type === "hardcopy").length ?? 0,
    free: ebooks?.filter((e: any) => e.is_free).length ?? 0,
    paid: ebooks?.filter((e: any) => !e.is_free).length ?? 0,
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `ebook-covers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file);
    if (error) {
      toast.error("আপলোড ব্যর্থ: " + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
    setForm({ ...form, cover_image_url: urlData.publicUrl });
    setUploading(false);
    toast.success("কভার ইমেজ আপলোড হয়েছে!");
  };

  const handleSave = async () => {
    if (!form.title || !form.category) {
      toast.error("শিরোনাম ও ক্যাটাগরি আবশ্যক");
      return;
    }
    const payload = {
      ...form,
      price: form.is_free ? 0 : form.price,
      discount_price: form.is_free ? null : (form.discount_price || null),
      pages: form.pages || null,
      purchase_link: form.purchase_link || null,
      cover_image_url: form.cover_image_url || null,
    } as any;
    if (editingId) {
      const { error } = await supabase.from("ebooks").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("বই আপডেট হয়েছে!");
    } else {
      const { error } = await supabase.from("ebooks").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("বই তৈরি হয়েছে!");
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    refresh();
  };

  const handleEdit = (e: any) => {
    setForm({
      title: e.title,
      description: e.description ?? "",
      category: e.category,
      author: e.author ?? "",
      pages: e.pages ?? 0,
      is_free: e.is_free,
      price: e.price ?? 0,
      discount_price: e.discount_price ?? null,
      download_url: e.download_url ?? "",
      book_type: e.book_type ?? "ebook",
      purchase_link: e.purchase_link ?? "",
      cover_image_url: e.cover_image_url ?? "",
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত?")) return;
    const { error } = await supabase.from("ebooks").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("বই মুছে ফেলা হয়েছে");
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">বই সমগ্র</h1>
          <p className="text-sm text-muted-foreground">সকল ই-বুক ও হার্ড কপি বই ম্যানেজ করুন</p>
        </div>
        <Button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" /> নতুন বই যোগ করুন
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "মোট বই", value: stats.total, icon: BookOpen, color: "text-primary" },
          { label: "ই-বুক", value: stats.ebook, icon: Tablet, color: "text-emerald-500" },
          { label: "হার্ড কপি", value: stats.hardcopy, icon: BookMarked, color: "text-amber-500" },
          { label: "ফ্রি", value: stats.free, icon: Eye, color: "text-blue-500" },
          { label: "পেইড", value: stats.paid, icon: DollarSign, color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
            <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-lg">{editingId ? "বই এডিট করুন" : "নতুন বই যোগ করুন"}</h3>

          {/* Cover image */}
          <div>
            <Label>কভার ইমেজ</Label>
            <div className="mt-1.5 flex items-center gap-3">
              {form.cover_image_url ? (
                <img src={form.cover_image_url} alt="cover" className="h-20 w-16 object-cover rounded-lg border" />
              ) : (
                <div className="h-20 w-16 rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
                  <Image className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
              <div className="space-y-1.5">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> {uploading ? "আপলোড হচ্ছে..." : "আপলোড"}
                </Button>
                <Input
                  placeholder="অথবা URL পেস্ট করুন"
                  value={form.cover_image_url}
                  onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                  className="rounded-lg text-xs h-8"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>শিরোনাম *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>ক্যাটাগরি *</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 rounded-xl" placeholder="যেমন: চাকরি প্রস্তুতি" />
            </div>
            <div>
              <Label>বইয়ের ধরন *</Label>
              <Select value={form.book_type} onValueChange={(v) => setForm({ ...form, book_type: v })}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ebook">📱 ই-বুক</SelectItem>
                  <SelectItem value="hardcopy">📖 হার্ড কপি</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>লেখক</Label>
              <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>পৃষ্ঠা সংখ্যা</Label>
              <Input type="number" value={form.pages || ""} onChange={(e) => setForm({ ...form, pages: Number(e.target.value) })} className="mt-1 rounded-xl" />
            </div>
            {form.book_type === "ebook" ? (
              <div>
                <Label>ডাউনলোড URL</Label>
                <Input value={form.download_url} onChange={(e) => setForm({ ...form, download_url: e.target.value })} className="mt-1 rounded-xl" placeholder="https://..." />
              </div>
            ) : (
              <div>
                <Label>ক্রয় লিংক</Label>
                <Input value={form.purchase_link} onChange={(e) => setForm({ ...form, purchase_link: e.target.value })} className="mt-1 rounded-xl" placeholder="https://..." />
              </div>
            )}
          </div>

          <div>
            <Label>বিবরণ</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 rounded-xl" placeholder="বইয়ের বিস্তারিত বিবরণ লিখুন..." />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} />
              <Label>ফ্রি</Label>
            </div>
            {!form.is_free && (
              <div className="flex items-center gap-2">
                <Label>মূল্য (৳)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-32 rounded-xl" />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave}>{editingId ? "আপডেট করুন" : "তৈরি করুন"}</Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>বাতিল</Button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="শিরোনাম বা লেখক দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল ধরন</SelectItem>
            <SelectItem value="ebook">ই-বুক</SelectItem>
            <SelectItem value="hardcopy">হার্ড কপি</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Book List */}
      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {filtered && filtered.length > 0 ? filtered.map((e: any) => (
          <div key={e.id} className="flex items-center gap-3 p-4">
            {/* Thumbnail */}
            <div className="hidden sm:flex h-14 w-11 shrink-0 rounded-lg border overflow-hidden bg-muted/50 items-center justify-center">
              {e.cover_image_url ? (
                <img src={e.cover_image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <BookMarked className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {e.book_type === "hardcopy" ? (
                  <BookMarked className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Tablet className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                )}
                <p className="font-semibold text-sm truncate">{e.title}</p>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {e.book_type === "hardcopy" ? "হার্ড কপি" : "ই-বুক"}
                </Badge>
                <Badge variant={e.is_free ? "default" : "outline"} className="text-[10px] shrink-0">
                  {e.is_free ? "ফ্রি" : `৳${e.price}`}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {e.category} · {e.author ?? "—"} · {e.pages ? `${e.pages} পৃষ্ঠা` : "—"}
                {e.cover_image_url ? " · 🖼️ কভার আছে" : ""}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(e)} className="text-xs gap-1">
                <Edit className="h-3 w-3" /> <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)} className="text-xs gap-1 text-destructive">
                <Trash2 className="h-3 w-3" /> <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        )) : (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? "কোনো বই পাওয়া যায়নি" : "এখনো কোনো বই যোগ করা হয়নি"}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardEbooks;
