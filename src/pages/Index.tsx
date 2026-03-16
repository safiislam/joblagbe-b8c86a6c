import { lazy, Suspense, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { optimizeStorageImage } from "@/lib/imageOptimize";
import Header from "@/components/Header";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import HeroSection from "@/components/HeroSection";
import QuickLinks from "@/components/QuickLinks";
import Footer from "@/components/Footer";
import { useAllSiteContent } from "@/hooks/useSiteContent";

// Lazy load below-the-fold sections to reduce initial JS bundle
const CategoryGrid = lazy(() => import("@/components/CategoryGrid"));
const JobBoard = lazy(() => import("@/components/JobBoard"));
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const EmployerCTA = lazy(() => import("@/components/EmployerCTA"));

const PopupBannerModal = lazy(() => import("@/components/PopupBanner"));

const SectionFallback = () => <div className="py-16" />;

// Homepage
const Index = () => {
  // Prefetch all site_content rows in a single query — child components
  // read from this cache instead of making 6 separate requests.
  useAllSiteContent();

  // Prefetch popup banner data early so the image can be preloaded before
  // the lazy PopupBannerModal component mounts, reducing LCP resource load delay.
  const { data: prefetchedBanners } = useQuery({
    queryKey: ["popup-banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("popup_banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Dynamically inject a preload link for the first banner image
  useEffect(() => {
    const firstBanner = prefetchedBanners?.[0];
    if (!firstBanner?.image_url) return;
    const optimizedUrl = optimizeStorageImage(firstBanner.image_url, { width: 600, quality: 70 });
    if (!optimizedUrl) return;

    // Avoid duplicate preload links
    const existing = document.querySelector(`link[rel="preload"][href="${optimizedUrl}"]`);
    if (existing) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = optimizedUrl;
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [prefetchedBanners]);

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBanner />
      
      <Header />
      <HeroSection />
      <QuickLinks />
      <Suspense fallback={<SectionFallback />}>
        <CategoryGrid />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <JobBoard />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <ServicesSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <EmployerCTA />
      </Suspense>
      <Footer />
      <Suspense fallback={null}>
        <AIChatWidget />
      </Suspense>
      <Suspense fallback={null}>
        <PopupBannerModal />
      </Suspense>
    </div>
  );
};

export default Index;
