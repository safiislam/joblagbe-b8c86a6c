import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, ArrowRight } from "lucide-react";

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-bangla">ক্যারিয়ার টিপস ও ব্লগ</h1>
          <p className="mt-2 text-muted-foreground">Expert career advice, interview tips, and industry insights</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group rounded-2xl border bg-card shadow-card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-elevated"
              >
                {post.cover_image_url ? (
                  <img src={post.cover_image_url} alt={post.title} className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-primary/5">
                    <BookOpen className="h-12 w-12 text-primary/30" />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs text-muted-foreground">{post.author_name} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                  <h3 className="mt-2 font-bold text-lg leading-snug group-hover:text-primary transition-colors">{post.title}</h3>
                  {post.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    পড়ুন <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-muted-foreground">
            <BookOpen className="mb-3 h-12 w-12 opacity-30" />
            <p className="text-lg font-medium">কোনো ব্লগ পোস্ট নেই</p>
            <p className="text-sm">শীঘ্রই নতুন আর্টিকেল আসছে!</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Blog;
