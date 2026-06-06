import { useEffect } from "react";
import SeoHead from "@/components/SeoHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getJobDisplayTag } from "@/lib/jobTag";
import { AffiliateSidebarAd, AffiliateInContentAd, AffiliateCarousel } from "@/components/AffiliateAds";

const Blog = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

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
      <SeoHead
        title="ক্যারিয়ার টিপস ও ব্লগ"
        description="চাকরির ইন্টারভিউ টিপস, সিভি লেখার কৌশল এবং ক্যারিয়ার গাইডলাইন পড়ুন Job লাগবে ব্লগে।"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Job লাগবে ব্লগ",
            url: "https://www.joblagbe.bd/blog",
            description: "চাকরির ইন্টারভিউ টিপস, সিভি লেখার কৌশল এবং ক্যারিয়ার গাইডলাইন।",
            inLanguage: "bn",
            ...(posts && posts.length > 0 && {
              blogPost: posts.slice(0, 20).map((p: any) => ({
                "@type": "BlogPosting",
                headline: p.title,
                url: `https://www.joblagbe.bd/blog/${p.slug}`,
                datePublished: p.created_at,
                dateModified: p.updated_at || p.created_at,
                author: { "@type": "Person", name: p.author_name },
                ...(p.cover_image_url && { image: p.cover_image_url }),
              })),
            }),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "হোম", item: "https://www.joblagbe.bd/" },
              { "@type": "ListItem", position: 2, name: "ব্লগ", item: "https://www.joblagbe.bd/blog" },
            ],
          },
        ]}
      />
      <Header />
      <div className="container py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-bangla">ক্যারিয়ার টিপস ও ব্লগ</h1>
          <p className="mt-2 text-muted-foreground">Expert career advice, interview tips, and industry insights</p>
        </div>

        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  {posts.map((post, index) => (
                    <div key={post.id}>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="group rounded-2xl border bg-card shadow-card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-elevated block h-full"
                      >
                        {post.cover_image_url ? (
                          <img src={post.cover_image_url} alt={post.title} className="h-44 w-full object-cover" />
                        ) : (
                          <div className="flex h-44 items-center justify-center bg-primary/5">
                            <BookOpen className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{post.author_name} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                            {(() => { const dt = getJobDisplayTag(null, post.created_at); return dt ? <Badge className="bg-accent/15 text-accent border-accent/20 text-[10px]">{dt}</Badge> : null; })()}
                          </div>
                          <h3 className="mt-2 font-bold text-lg leading-snug group-hover:text-primary transition-colors">{post.title}</h3>
                          {post.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                            পড়ুন <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>
                      {(index + 1) % 4 === 0 && <div className="mt-4"><AffiliateInContentAd /></div>}
                    </div>
                  ))}
                </div>
                <AffiliateCarousel />
              </>
            ) : (
              <div className="flex flex-col items-center py-20 text-muted-foreground">
                <BookOpen className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-lg font-medium">কোনো ব্লগ পোস্ট নেই</p>
                <p className="text-sm">শীঘ্রই নতুন আর্টিকেল আসছে!</p>
              </div>
            )}
          </div>

          {/* Sidebar Ads */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-6">
            <AffiliateSidebarAd placement="sidebar" />
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Blog;
