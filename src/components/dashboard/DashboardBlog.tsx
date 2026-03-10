import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

const DashboardBlog = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "", author_name: "Job Lagbe Team" });

  const { data: posts } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_posts").select("id, title, slug, is_published, created_at, author_name").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const handleCreate = async () => {
    if (!form.title || !form.slug || !form.content) { toast.error("Fill in title, slug, and content"); return; }
    const { error } = await supabase.from("blog_posts").insert({ ...form, is_published: true });
    if (error) { toast.error(error.message); return; }
    toast.success("Blog post created!");
    setShowForm(false);
    setForm({ title: "", slug: "", content: "", excerpt: "", author_name: "Job Lagbe Team" });
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("blog_posts").update({ is_published: !current }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog Posts ({posts?.length ?? 0})</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1 bg-accent text-accent-foreground">
          <Plus className="h-3.5 w-3.5" /> New Post
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-card p-4 space-y-3 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 rounded-xl" placeholder="ক্যারিয়ার টিপস: ইন্টারভিউ প্রস্তুতি" /></div>
            <div><Label>Slug (URL)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} className="mt-1 rounded-xl" placeholder="career-tips-interview" /></div>
          </div>
          <div><Label>Excerpt</Label><Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="mt-1 rounded-xl" placeholder="Short description..." /></div>
          <div><Label>Content (Markdown)</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} className="mt-1 rounded-xl font-mono text-sm" placeholder="Write your blog content in Markdown..." /></div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} className="bg-success text-success-foreground">Publish</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {posts && posts.length > 0 ? posts.map((post) => (
          <div key={post.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-sm">{post.title}</p>
              <p className="text-xs text-muted-foreground">{post.author_name} · /{post.slug} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={post.is_published ? "border-success text-success" : "border-muted-foreground text-muted-foreground"}>
                {post.is_published ? "Published" : "Draft"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => togglePublish(post.id, post.is_published)} className="text-xs">
                {post.is_published ? "Unpublish" : "Publish"}
              </Button>
            </div>
          </div>
        )) : <div className="p-8 text-center text-muted-foreground">No blog posts yet</div>}
      </div>
    </div>
  );
};

export default DashboardBlog;
