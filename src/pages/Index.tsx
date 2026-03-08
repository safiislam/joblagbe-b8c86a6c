import Header from "@/components/Header";
import FraudWarning from "@/components/FraudWarning";
import HeroSection from "@/components/HeroSection";
import QuickLinks from "@/components/QuickLinks";
import CategoryGrid from "@/components/CategoryGrid";
import JobBoard from "@/components/JobBoard";
import ServicesSection from "@/components/ServicesSection";
import EmployerCTA from "@/components/EmployerCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <FraudWarning />
      <Header />
      <HeroSection />
      <QuickLinks />
      <CategoryGrid />
      <JobBoard />
      <ServicesSection />
      <EmployerCTA />
      <Footer />
    </div>
  );
};

export default Index;
