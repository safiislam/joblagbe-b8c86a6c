import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Image as ImageIcon, Upload, X, Loader2, Eye, Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author_name: string;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
};

const emptyForm = { title: "", slug: "", content: "", excerpt: "", author_name: "Job Lagbe Team", cover_image_url: "" };

const DashboardBlog = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [insertingImage, setInsertingImage] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const contentImageRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [contentTab, setContentTab] = useState<"write" | "preview">("write");
  const [fullscreen, setFullscreen] = useState(false);

  const { data: posts } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      return (data as BlogPost[]) ?? [];
    },
  });

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${uuidv4()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) {
      toast.error("Image upload failed: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    const url = await uploadImage(file, "covers");
    if (url) setForm((f) => ({ ...f, cover_image_url: url }));
    setUploading(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleContentImageInsert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setInsertingImage(true);
    const url = await uploadImage(file, "content");
    if (url && textareaRef.current) {
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const before = form.content.slice(0, start);
      const after = form.content.slice(start);
      const markdown = `\n![image](${url})\n`;
      setForm((f) => ({ ...f, content: before + markdown + after }));
      // Move cursor after the inserted text
      setTimeout(() => {
        ta.focus();
        const pos = start + markdown.length;
        ta.setSelectionRange(pos, pos);
      }, 50);
    }
    setInsertingImage(false);
    if (contentImageRef.current) contentImageRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.content) {
      toast.error("Title, slug, and content are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        content: form.content,
        excerpt: form.excerpt || null,
        author_name: form.author_name,
        cover_image_url: form.cover_image_url || null,
      };

      if (editingId) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Blog post updated!");
      } else {
        const { error } = await supabase.from("blog_posts").insert({ ...payload, is_published: true });
        if (error) throw error;
        toast.success("Blog post created!");
      }
      closeForm();
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      author_name: post.author_name,
      cover_image_url: post.cover_image_url || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("blog_posts").update({ is_published: !current }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    toast.success(current ? "Unpublished" : "Published");
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog Posts ({posts?.length ?? 0})</h1>
        <Button
          size="sm"
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
          className="gap-1 bg-accent text-accent-foreground"
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? "Cancel" : "New Post"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
          <h2 className="font-bold text-lg">{editingId ? "Edit Post" : "Create New Post"}</h2>

          {/* Cover Image */}
          <div>
            <Label>Cover / Featured Image</Label>
            <div className="mt-1.5">
              {form.cover_image_url ? (
                <div className="relative group rounded-xl overflow-hidden border max-h-48">
                  <img src={form.cover_image_url} alt="Cover" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => setForm((f) => ({ ...f, cover_image_url: "" }))}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 p-6 w-full text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  <span className="text-sm">{uploading ? "Uploading..." : "Click to upload cover image (max 5MB)"}</span>
                </button>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    slug: editingId ? f.slug : title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"),
                  }));
                }}
                className="mt-1 rounded-xl"
                placeholder="ক্যারিয়ার টিপস: ইন্টারভিউ প্রস্তুতি"
              />
            </div>
            <div>
              <Label>Slug (URL) *</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                className="mt-1 rounded-xl"
                placeholder="career-tips-interview"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Excerpt</Label>
              <Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="mt-1 rounded-xl" placeholder="Short description..." />
            </div>
            <div>
              <Label>Author Name</Label>
              <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="mt-1 rounded-xl" />
            </div>
          </div>

          <div className={fullscreen ? "fixed inset-0 z-[200] bg-background p-4 flex flex-col" : ""}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Label>Content (Markdown) *</Label>
                <div className="flex rounded-lg border overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setContentTab("write")}
                    className={`px-3 py-1 transition-colors ${contentTab === "write" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >Write</button>
                  <button
                    type="button"
                    onClick={() => setContentTab("preview")}
                    className={`px-3 py-1 transition-colors ${contentTab === "preview" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >Preview</button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {contentTab === "write" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => contentImageRef.current?.click()}
                    disabled={insertingImage}
                    className="gap-1.5 text-xs"
                  >
                    {insertingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                    Insert Image
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFullscreen((f) => !f)}
                  className="gap-1.5 text-xs"
                >
                  {fullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                  {fullscreen ? "Exit" : "Fullscreen"}
                </Button>
              </div>
              <input ref={contentImageRef} type="file" accept="image/*" className="hidden" onChange={handleContentImageInsert} />
            </div>

            {contentTab === "write" ? (
              <Textarea
                ref={textareaRef}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={fullscreen ? 30 : 12}
                className={`mt-1 rounded-xl font-mono text-sm ${fullscreen ? "flex-1 resize-none" : ""}`}
                placeholder="Write your blog content in Markdown...&#10;&#10;Use **bold**, *italic*, ## headings, - lists&#10;Click 'Insert Image' to add images inline"
              />
            ) : (
              <div className={`mt-1 rounded-xl border bg-card p-4 overflow-auto prose prose-sm max-w-none ${fullscreen ? "flex-1" : "min-h-[300px] max-h-[500px]"}`}>
                {form.content ? (
                  <ReactMarkdown
                    components={{
                      img: ({ src, alt }) => (
                        <img src={src} alt={alt || ""} className="max-w-full rounded-lg my-2" loading="lazy" />
                      ),
                    }}
                  >{form.content}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground italic">Nothing to preview yet...</p>
                )}
              </div>
            )}

            {fullscreen && (
              <div className="flex gap-2 mt-3">
                <Button onClick={handleSave} disabled={saving} className="bg-success text-success-foreground gap-1.5">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Update Post" : "Publish"}
                </Button>
                <Button variant="ghost" onClick={() => setFullscreen(false)}>Exit Fullscreen</Button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="bg-success text-success-foreground gap-1.5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Update Post" : "Publish"}
            </Button>
            <Button variant="ghost" onClick={closeForm}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {posts && posts.length > 0 ? posts.map((post) => (
          <div key={post.id} className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3 min-w-0">
              {post.cover_image_url && (
                <img src={post.cover_image_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{post.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {post.author_name} · /{post.slug} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className={post.is_published ? "border-success text-success" : "border-muted-foreground text-muted-foreground"}>
                {post.is_published ? "Published" : "Draft"}
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(post)} title="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublish(post.id, post.is_published)} title={post.is_published ? "Unpublish" : "Publish"}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(post.id, post.title)} title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )) : <div className="p-8 text-center text-muted-foreground">No blog posts yet</div>}
      </div>
    </div>
  );
};

export default DashboardBlog;
