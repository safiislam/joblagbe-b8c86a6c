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

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBanner />
      <FraudWarning />
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
