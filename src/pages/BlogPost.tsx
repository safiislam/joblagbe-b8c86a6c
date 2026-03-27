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

            <div className="prose prose-lg mt-8 max-w-none text-foreground
              prose-headings:text-foreground prose-headings:font-bold
              prose-h1:text-3xl prose-h1:leading-tight prose-h1:mt-10 prose-h1:mb-5 prose-h1:border-b prose-h1:border-border prose-h1:pb-3
              prose-h2:text-2xl prose-h2:leading-snug prose-h2:mt-9 prose-h2:mb-4
              prose-h3:text-xl prose-h3:leading-snug prose-h3:mt-8 prose-h3:mb-3
              prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2
              prose-p:text-base prose-p:leading-[1.9] prose-p:mb-6 prose-p:text-foreground/90
              prose-li:text-base prose-li:leading-[1.9] prose-li:mb-1.5
              prose-ul:my-5 prose-ul:pl-6 prose-ol:my-5 prose-ol:pl-6
              prose-blockquote:border-l-4 prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:text-muted-foreground prose-blockquote:not-italic prose-blockquote:my-7
              prose-a:text-primary prose-a:underline prose-a:underline-offset-2 prose-a:font-medium
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-medium
              prose-pre:bg-muted prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-pre:my-6
              prose-hr:border-border prose-hr:my-10
              prose-img:rounded-xl prose-img:shadow-md prose-img:my-6
              prose-strong:text-foreground prose-strong:font-semibold
              prose-em:text-foreground/80
            ">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="whitespace-pre-line">{children}</p>,
                  br: () => <br />,
                  h1: ({ children }) => <h1>{children}</h1>,
                  h2: ({ children }) => <h2>{children}</h2>,
                  h3: ({ children }) => <h3>{children}</h3>,
                  h4: ({ children }) => <h4>{children}</h4>,
                  img: ({ src, alt }) => (
                    <img src={src} alt={alt || ""} className="max-w-full rounded-xl my-6" loading="lazy" />
                  ),
                }}
              >
                {post.content
                  .replace(/\r\n/g, "\n")
                  .replace(/\n{3,}/g, "\n\n")
                }
              </ReactMarkdown>
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
