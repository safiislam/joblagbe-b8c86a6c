import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, ExternalLink, Image, Loader2, Search, Eye,
} from "lucide-react";

const placementLabels: Record<string, string> = {
  sidebar: "Sidebar Ad",
  in_content: "In-Content Ad",
  popup: "Popup Banner",
  sticky_banner: "📱 Sticky Banner",
  carousel: "📱 Carousel",
};

const categoryOptions = ["general", "tech", "education", "lifestyle", "tools", "books"];

const emptyForm = {
  title: "", description: "", image_url: "", affiliate_link: "",
  category: "general", placement: "sidebar", price: 0, discount_price: 0,
  is_active: true, sort_order: 0,
};

const DashboardAffiliates = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["admin-affiliate-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_products")
        .select("*")
        .order("sort_order", { ascending: true });
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.affiliate_link.trim()) throw new Error("Title and link required");
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        image_url: form.image_url || null,
        affiliate_link: form.affiliate_link.trim(),
        category: form.category,
        placement: form.placement,
        price: form.price || 0,
        discount_price: form.discount_price || null,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };
      if (editing) {
        const { error } = await supabase.from("affiliate_products").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("affiliate_products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliate-products"] });
      toast.success(editing ? "আপডেট হয়েছে" : "যোগ করা হয়েছে");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("affiliate_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliate-products"] });
      toast.success("ডিলিট হয়েছে");
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = (p: any) => {
    setEditing(p.id);
    setForm({
      title: p.title, description: p.description || "", image_url: p.image_url || "",
      affiliate_link: p.affiliate_link, category: p.category, placement: p.placement,
      price: p.price || 0, discount_price: p.discount_price || 0,
      is_active: p.is_active, sort_order: p.sort_order,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    setUploading(true);
    const path = `affiliate/${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
  };

  const filtered = (products ?? []).filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: products?.length ?? 0,
    active: products?.filter(p => p.is_active).length ?? 0,
    sidebar: products?.filter(p => p.placement === "sidebar" || p.placement === "in_content").length ?? 0,
    mobile: products?.filter(p => ["sticky_banner", "carousel"].includes(p.placement)).length ?? 0,
    popup: products?.filter(p => p.placement === "popup").length ?? 0,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Affiliate Products</h1>
        <Button className="gap-1.5" onClick={() => { setForm(emptyForm); setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Active", value: stats.active, color: "text-success" },
          { label: "Sidebar/Content", value: stats.sidebar, color: "text-primary" },
          { label: "📱 Mobile", value: stats.mobile, color: "text-accent-foreground" },
          { label: "Popup", value: stats.popup, color: "text-warning" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Placement</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Image className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{p.title}</p>
                      <a href={p.affiliate_link} target="_blank" rel="noopener" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
                        Link <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary" className="text-xs">{placementLabels[p.placement] || p.placement}</Badge></TableCell>
                <TableCell className="text-sm capitalize">{p.category}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={p.is_active ? "text-success border-success/30" : "text-muted-foreground"}>
                    {p.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {p.discount_price ? (
                    <span>
                      <span className="line-through text-muted-foreground mr-1">৳{p.price}</span>
                      <span className="text-success font-medium">৳{p.discount_price}</span>
                    </span>
                  ) : p.price > 0 ? `৳${p.price}` : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => {
                      if (confirm("Delete this product?")) deleteMutation.mutate(p.id);
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No affiliate products found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Affiliate Product"}</DialogTitle>
            <DialogDescription>Fill in the product details for affiliate promotion</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Product name" />
            </div>
            <div className="space-y-1.5">
              <Label>Affiliate Link *</Label>
              <Input value={form.affiliate_link} onChange={e => setForm(f => ({ ...f, affiliate_link: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Product Image</Label>
              {form.image_url ? (
                <div className="relative w-fit">
                  <img src={form.image_url} className="h-20 rounded-lg object-cover" />
                  <Button size="sm" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={() => setForm(f => ({ ...f, image_url: "" }))}>×</Button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Image className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload Image</span></>}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Placement</Label>
                <Select value={form.placement} onValueChange={v => setForm(f => ({ ...f, placement: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sidebar">Sidebar Ad</SelectItem>
                    <SelectItem value="in_content">In-Content Ad</SelectItem>
                    <SelectItem value="popup">Popup Banner</SelectItem>
                    <SelectItem value="sticky_banner">📱 Sticky Banner</SelectItem>
                    <SelectItem value="carousel">📱 Carousel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Price (৳)</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Discount (৳)</Label>
                <Input type="number" value={form.discount_price} onChange={e => setForm(f => ({ ...f, discount_price: +e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardAffiliates;
