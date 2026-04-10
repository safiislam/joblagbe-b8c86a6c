import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "https://www.joblagbe.bd";
const DEFAULT_TITLE = "Job লাগবে? — বাংলাদেশের বিশ্বস্ত চাকরির প্ল্যাটফর্ম";
const DEFAULT_DESCRIPTION =
  "বাংলাদেশের সকল সরকারি-বেসরকারি চাকরির বিজ্ঞপ্তি, ক্যারিয়ার টিপস, কোর্স ও ই-বুক এক জায়গায়। আজই আবেদন করুন!";
const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/1zQLQpZ4o0gwAtxMKsXEbVFBN3y2/social-images/social-1772994739568-job-lagbe-form.webp";

interface SeoHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const setMetaTag = (attr: string, key: string, content: string) => {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
};

const SeoHead = ({
  title,
  description,
  ogImage,
  ogType = "website",
  noIndex = false,
  jsonLd,
}: SeoHeadProps) => {
  const { pathname } = useLocation();
  const canonicalUrl = `${BASE_URL}${pathname === "/" ? "/" : pathname.replace(/\/+$/, "")}`;

  const pageTitle = title ? `${title} | Job লাগবে` : DEFAULT_TITLE;
  const pageDesc = description || DEFAULT_DESCRIPTION;
  const pageImage = ogImage || DEFAULT_OG_IMAGE;

  useEffect(() => {
    // Title
    document.title = pageTitle;

    // Canonical
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonicalUrl;

    // Hreflang bn
    let hrefBn = document.querySelector<HTMLLinkElement>('link[hreflang="bn"]');
    if (!hrefBn) {
      hrefBn = document.createElement("link");
      hrefBn.rel = "alternate";
      hrefBn.hreflang = "bn";
      document.head.appendChild(hrefBn);
    }
    hrefBn.href = canonicalUrl;

    // Hreflang x-default
    let hrefDefault = document.querySelector<HTMLLinkElement>('link[hreflang="x-default"]');
    if (!hrefDefault) {
      hrefDefault = document.createElement("link");
      hrefDefault.rel = "alternate";
      hrefDefault.hreflang = "x-default";
      document.head.appendChild(hrefDefault);
    }
    hrefDefault.href = canonicalUrl;

    // Meta description
    setMetaTag("name", "description", pageDesc);

    // Robots
    setMetaTag("name", "robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

    // Open Graph
    setMetaTag("property", "og:title", pageTitle);
    setMetaTag("property", "og:description", pageDesc);
    setMetaTag("property", "og:url", canonicalUrl);
    setMetaTag("property", "og:image", pageImage);
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:site_name", "Job লাগবে");
    setMetaTag("property", "og:locale", "bn_BD");

    // Twitter
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", pageTitle);
    setMetaTag("name", "twitter:description", pageDesc);
    setMetaTag("name", "twitter:image", pageImage);

    // JSON-LD
    const jsonLdId = "seo-head-jsonld";
    let scriptEl = document.getElementById(jsonLdId) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.id = jsonLdId;
        scriptEl.type = "application/ld+json";
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(
        Array.isArray(jsonLd) ? jsonLd : jsonLd
      );
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      // Cleanup JSON-LD on unmount so next page can set its own
      const el = document.getElementById(jsonLdId);
      if (el) el.remove();
    };
  }, [canonicalUrl, pageTitle, pageDesc, pageImage, ogType, noIndex, jsonLd]);

  return null;
};

export default SeoHead;
