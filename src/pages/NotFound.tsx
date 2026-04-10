import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import SeoHead from "@/components/SeoHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, Home, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead title="পৃষ্ঠা পাওয়া যায়নি — ৪০৪" noIndex />
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <h1 className="text-7xl font-extrabold text-primary mb-2">৪০৪</h1>
          <p className="text-xl font-semibold mb-2">পৃষ্ঠা পাওয়া যায়নি</p>
          <p className="text-muted-foreground mb-8">
            দুঃখিত, আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি সরিয়ে ফেলা হয়েছে অথবা লিঙ্কটি ভুল।
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild>
              <Link to="/"><Home className="h-4 w-4 mr-1.5" /> হোমে ফিরুন</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/jobs"><Briefcase className="h-4 w-4 mr-1.5" /> চাকরি খুঁজুন</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
