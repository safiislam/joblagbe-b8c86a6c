import { lazy, Suspense } from "react";
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
const AIChatWidget = lazy(() => import("@/components/AIChatWidget"));
const PopupBannerModal = lazy(() => import("@/components/PopupBanner"));

const SectionFallback = () => <div className="py-16" />;

// Homepage
const Index = () => {
  // Prefetch all site_content rows in a single query — child components
  // read from this cache instead of making 6 separate requests.
  useAllSiteContent();

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
    </div>
  );
};

export default Index;
