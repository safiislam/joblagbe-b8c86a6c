import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_URL = "https://www.joblagbe.bd";

const STATIC_ROUTES = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/jobs", priority: "0.9", changefreq: "daily" },
  { loc: "/blog", priority: "0.8", changefreq: "weekly" },
  { loc: "/courses", priority: "0.7", changefreq: "weekly" },
  { loc: "/ebooks", priority: "0.7", changefreq: "weekly" },
  { loc: "/companies", priority: "0.7", changefreq: "weekly" },
  { loc: "/contact", priority: "0.5", changefreq: "monthly" },
  { loc: "/install", priority: "0.4", changefreq: "monthly" },
  { loc: "/login", priority: "0.3", changefreq: "monthly" },
  { loc: "/signup", priority: "0.3", changefreq: "monthly" },
  { loc: "/privacy-policy", priority: "0.2", changefreq: "yearly" },
  { loc: "/terms", priority: "0.2", changefreq: "yearly" },
];

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all dynamic content in parallel
  const [jobsRes, blogsRes, companiesRes] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, updated_at")
      .eq("is_active", true)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("companies")
      .select("id, updated_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const jobs = jobsRes.data ?? [];
  const blogs = blogsRes.data ?? [];
  const companies = companiesRes.data ?? [];

  let urls = "";

  // Static routes
  for (const route of STATIC_ROUTES) {
    urls += `  <url>
    <loc>${escapeXml(BASE_URL + route.loc)}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>\n`;
  }

  // Jobs
  for (const job of jobs) {
    urls += `  <url>
    <loc>${escapeXml(BASE_URL + "/jobs/" + job.id)}</loc>
    <lastmod>${formatDate(job.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
  }

  // Blog posts
  for (const post of blogs) {
    urls += `  <url>
    <loc>${escapeXml(BASE_URL + "/blog/" + post.slug)}</loc>
    <lastmod>${formatDate(post.updated_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
  }

  // Companies
  for (const company of companies) {
    urls += `  <url>
    <loc>${escapeXml(BASE_URL + "/company/" + company.id)}</loc>
    <lastmod>${formatDate(company.updated_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});
