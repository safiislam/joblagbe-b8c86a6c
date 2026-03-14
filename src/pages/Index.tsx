import Header from "@/components/Header";
import AnnouncementBanner from "@/components/AnnouncementBanner";

import HeroSection from "@/components/HeroSection";
import QuickLinks from "@/components/QuickLinks";
import CategoryGrid from "@/components/CategoryGrid";
import JobBoard from "@/components/JobBoard";
import ServicesSection from "@/components/ServicesSection";
import EmployerCTA from "@/components/EmployerCTA";
import Footer from "@/components/Footer";
import AIChatWidget from "@/components/AIChatWidget";
import { useAllSiteContent } from "@/hooks/useSiteContent";

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
      <CategoryGrid />
      <JobBoard />
      <ServicesSection />
      <EmployerCTA />
      <Footer />
      <AIChatWidget />
    </div>
  );
};

export default Index;
