import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import JobBoard from "@/components/JobBoard";
import EmployerCTA from "@/components/EmployerCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <CategoryGrid />
      <JobBoard />
      <EmployerCTA />
      <Footer />
    </div>
  );
};

export default Index;
