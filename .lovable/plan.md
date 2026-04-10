

# SEO Audit Report — joblagbe.bd

## Score: 7/10 — Good Foundation, Key Gaps to Fix

---

## What's Working Well

1. **SeoHead component** — Dynamic title, description, canonical, og:tags, hreflang, JSON-LD on most pages
2. **index.html** — Proper `lang="bn"`, preconnect hints, inline critical CSS, skeleton for FCP
3. **Structured data** — Homepage has WebSite + Organization JSON-LD; JobDetail has JobPosting schema
4. **robots.txt** — Allows all crawlers, references sitemap
5. **sitemap.xml** — Covers main static routes with priorities
6. **Bengali descriptions** — Good localized meta descriptions on all key pages
7. **Performance** — Lazy loading, font preloading, image optimization utilities

---

## Issues Found (Ranked by Impact)

### CRITICAL

**1. SPA Rendering = Invisible to Most Crawlers**
- All meta tags are set via JavaScript (`document.createElement`). Googlebot can handle this, but Facebook, Twitter, LinkedIn, Telegram, WhatsApp preview bots CANNOT execute JS.
- **Fix**: Use a prerendering service (e.g., prerender.io) or add server-side rendering for meta tags. Short-term: set static fallback OG tags in `index.html` that cover the homepage case.
- **Status**: Partially mitigated — `index.html` has static OG tags for homepage, but all other pages (jobs, blog posts, companies) will show generic homepage meta when shared on social media.

**2. Missing `<SeoHead>` on Several Pages**
- `NotFound.tsx` — No SeoHead, no `noIndex` (404 pages could get indexed with empty content)
- `Install.tsx` — No SeoHead at all
- `ResetPassword.tsx` — No SeoHead
- `Dashboard.tsx` / `Admin.tsx` — No `noIndex` SeoHead (admin pages could leak into search)
- `PostJob.tsx` — No SeoHead
- `SeekerDashboard.tsx` / `EmployerDashboard.tsx` — No SeoHead

### HIGH

**3. Sitemap is Static — Misses Dynamic Content**
- Individual job pages (`/jobs/:id`), blog posts (`/blog/:slug`), company profiles (`/company/:id`) are NOT in the sitemap
- These are your most valuable pages for SEO
- **Fix**: Generate a dynamic sitemap via an edge function that queries the database

**4. Duplicate/Conflicting Meta Tags in index.html**
- `index.html` has hardcoded `og:title`, `og:description`, `twitter:title`, `twitter:description` at the bottom of `<head>` AND the SeoHead component creates them dynamically
- The hardcoded description is in English ("Bangladesh's trusted job portal") while SeoHead sets Bengali
- **Fix**: Remove duplicate hardcoded OG/Twitter tags from index.html; keep only the base fallbacks

**5. Missing JSON-LD on Key Pages**
- Blog posts — No Article schema
- Company profiles — No Organization schema  
- Courses page — No Course schema
- Jobs listing page — No ItemList schema
- **Fix**: Add appropriate JSON-LD structured data to each page type

### MEDIUM

**6. Image SEO Issues**
- Company logos in JobDetail use `alt=""` (empty alt text)
- Many dashboard images use `alt=""` or generic alt text
- No `width`/`height` attributes on most images (causes CLS)
- **Fix**: Use descriptive alt text: `alt={company.name + " logo"}`

**7. Twitter Site Tag Wrong**
- `index.html` line 45: `twitter:site` is `@Lovable` instead of your own brand handle
- **Fix**: Change to your brand's Twitter handle or remove

**8. No `og:url` in index.html Static Tags**
- Missing static `og:url` and `og:site_name` fallbacks
- **Fix**: Add `<meta property="og:url" content="https://www.joblagbe.bd/" />`

**9. Missing `<lastmod>` in Sitemap**
- No `<lastmod>` dates in sitemap entries — crawlers can't prioritize fresh content
- **Fix**: Add lastmod dates, ideally from database timestamps

**10. No Breadcrumb Structured Data**
- Job detail and blog post pages lack BreadcrumbList JSON-LD
- This helps Google show breadcrumbs in search results

### LOW

**11. 404 Page Needs Work**
- Text is in English ("Oops! Page not found") on a Bengali site
- No Header/Footer, no SeoHead with noIndex
- No helpful links or search to reduce bounce

**12. Missing `manifest.json` Link in HTML**
- PWA icons referenced but no `<link rel="manifest">` in index.html

**13. No `<h1>` Hierarchy Enforcement**
- Multiple pages may have inconsistent heading structures

---

## Implementation Plan

### Phase 1 — Quick Fixes (High Impact, Low Effort)
1. Add `<SeoHead noIndex />` to NotFound, Dashboard, Admin, PostJob, Install, ResetPassword, SeekerDashboard, EmployerDashboard
2. Remove duplicate OG/Twitter meta tags from bottom of `index.html`
3. Fix `twitter:site` to correct brand handle
4. Fix empty `alt=""` on company logos → use company name
5. Translate 404 page to Bengali, add Header/Footer

### Phase 2 — Structured Data
6. Add Article JSON-LD to BlogPost.tsx
7. Add BreadcrumbList JSON-LD to JobDetail and BlogPost
8. Add ItemList JSON-LD to Jobs listing page
9. Add Organization JSON-LD to CompanyProfile

### Phase 3 — Dynamic Sitemap
10. Create an edge function `sitemap/index.ts` that queries jobs, blog posts, and companies to generate a dynamic sitemap.xml
11. Update robots.txt to point to the edge function URL

### Technical Details

**Files to modify:**
- `index.html` — Remove duplicate meta, fix twitter:site
- `src/pages/NotFound.tsx` — Add SeoHead, Bengali text, Header/Footer
- `src/pages/PostJob.tsx` — Add `<SeoHead noIndex />`
- `src/pages/Dashboard.tsx` — Add `<SeoHead noIndex />`
- `src/pages/Install.tsx` — Add `<SeoHead title="অ্যাপ ইনস্টল করুন" />`
- `src/pages/ResetPassword.tsx` — Add `<SeoHead noIndex />`
- `src/pages/BlogPost.tsx` — Add Article JSON-LD
- `src/pages/JobDetail.tsx` — Add BreadcrumbList JSON-LD, fix logo alt
- `src/pages/Jobs.tsx` — Add ItemList JSON-LD
- `src/pages/CompanyProfile.tsx` — Add Organization JSON-LD

**New files:**
- `supabase/functions/sitemap/index.ts` — Dynamic sitemap generator

**No database changes needed.**

