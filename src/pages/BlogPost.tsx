import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowLeft, Share2, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

const BlogPost = () => {
  const { slug } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      return data;
    },
    enabled: !!slug,
  });

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: post?.title, url: shareUrl });
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-3xl py-8">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> সব ব্লগ পোস্ট
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          </div>
        ) : post ? (
          <article>
            <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <span>{post.author_name}</span>
              <span>·</span>
              <span>{format(new Date(post.created_at), "MMMM d, yyyy")}</span>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Share
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener" className="gap-1.5">
                  <Facebook className="h-3.5 w-3.5" /> Facebook
                </a>
              </Button>
            </div>

            {post.cover_image_url && (
              <img src={post.cover_image_url} alt={post.title} className="mt-6 w-full rounded-2xl object-cover max-h-96" />
            )}

            <div className="prose prose-lg mt-8 max-w-none text-foreground">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </article>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg font-medium">পোস্ট পাওয়া যায়নি</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BlogPost;
