import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "https://www.joblagbe.bd";

const SeoHead = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const canonicalUrl = `${BASE_URL}${pathname === "/" ? "/" : pathname.replace(/\/+$/, "")}`;

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

    // OG URL
    let ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    ogUrl.content = canonicalUrl;
  }, [pathname]);

  return null;
};

export default SeoHead;
