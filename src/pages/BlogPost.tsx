import SeoHead from "@/components/SeoHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowLeft, Share2, Facebook, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const estimateReadTime = (text: string) => {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

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

  const readTime = post ? estimateReadTime(post.content) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-3xl py-8 px-4 sm:px-6">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> সব ব্লগ পোস্ট
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          </div>
        ) : post ? (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Article",
                  headline: post.title,
                  ...(post.cover_image_url && { image: post.cover_image_url }),
                  datePublished: post.created_at,
                  dateModified: post.updated_at,
                  author: { "@type": "Person", name: post.author_name },
                  publisher: {
                    "@type": "Organization",
                    name: "Job লাগবে",
                    url: "https://joblagbe.bd",
                  },
                  ...(post.excerpt && { description: post.excerpt }),
                  mainEntityOfPage: {
                    "@type": "WebPage",
                    "@id": typeof window !== "undefined" ? window.location.href : "",
                  },
                }),
              }}
            />
          <article>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-foreground">
              {post.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/70">{post.author_name}</span>
              <span className="text-muted-foreground/40">·</span>
              <span>{format(new Date(post.created_at), "MMMM d, yyyy")}</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {readTime} min read
              </span>
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
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="mt-8 w-full rounded-2xl object-cover max-h-[28rem] shadow-md"
              />
            )}

            <div className="blog-content mt-10 max-w-none text-foreground">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-extrabold leading-tight mt-12 mb-5 pb-3 border-b border-border text-foreground">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold leading-snug mt-10 mb-4 text-foreground">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-bold leading-snug mt-8 mb-3 text-foreground">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-lg font-semibold mt-6 mb-2 text-foreground">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="text-base leading-[1.9] mb-6 text-foreground/90 whitespace-pre-line">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-5 pl-6 list-disc space-y-1.5 text-base leading-[1.9] text-foreground/90">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-5 pl-6 list-decimal space-y-1.5 text-base leading-[1.9] text-foreground/90">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-[1.9]">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-l-primary bg-muted/50 py-3 px-5 rounded-r-lg text-muted-foreground not-italic my-7">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} className="text-primary underline underline-offset-2 font-medium hover:text-primary/80 transition-colors" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return (
                        <pre className="bg-muted rounded-xl border border-border my-6 p-4 overflow-x-auto">
                          <code className={`text-sm font-mono ${className}`} {...props}>
                            {children}
                          </code>
                        </pre>
                      );
                    }
                    return (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-medium" {...props}>
                        {children}
                      </code>
                    );
                  },
                  hr: () => <hr className="border-border my-10" />,
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt || ""}
                      className="max-w-full rounded-xl shadow-md my-6"
                      loading="lazy"
                    />
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="text-foreground/80">{children}</em>
                  ),
                  table: ({ children }) => (
                    <div className="my-6 overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-muted/70 text-foreground font-semibold">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2.5 text-left border-b border-border">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2.5 border-b border-border/50">{children}</td>
                  ),
                  br: () => <br />,
                }}
              >
                {post.content
                  .replace(/\r\n/g, "\n")
                  .replace(/\n{3,}/g, "\n\n")
                }
              </ReactMarkdown>
            </div>
          </article>
          </>
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
