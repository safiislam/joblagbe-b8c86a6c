import { Search, MapPin, TrendingUp } from "lucide-react";
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteContent } from "@/hooks/useSiteContent";

type HeroData = {
  badge: string;
  title_line1: string;
  title_highlight: string;
  subtitle: string;
  popular_tags: string[];
};

const defaults: HeroData = {
  badge: "বাংলাদেশের #১ জব পোর্টাল",
  title_line1: "আপনার ক্যারিয়ারের পরবর্তী ধাপ",
  title_highlight: "শুরু হোক এখানে",
  subtitle: "Thousands of jobs from top employers across Bangladesh. Find your dream career today.",
  popular_tags: ["Software Engineer", "Marketing", "Accountant", "Designer", "Data Entry"],
};

const HeroSection = () => {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const { data, isLoading } = useSiteContent<HeroData>("hero");
  const c = data || defaults;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  const handleTagClick = (tag: string) => {
    navigate(`/jobs?q=${encodeURIComponent(tag)}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(hsl(var(--primary)) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          {isLoading ? (
            <>
              <Skeleton className="mx-auto mb-4 h-8 w-48 rounded-full" />
              <Skeleton className="mx-auto h-12 w-3/4 rounded-lg" />
              <Skeleton className="mx-auto mt-4 h-6 w-2/3 rounded-lg" />
            </>
          ) : (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm shadow-card animate-fade-in">
                <TrendingUp className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">{c.badge}</span>
              </div>

              <h1 className="font-bangla text-3xl font-bold leading-tight text-foreground md:text-5xl lg:text-[3.5rem] animate-fade-in">
                {c.title_line1}{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{c.title_highlight}</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
                {c.subtitle}
              </p>
            </>
          )}
        </div>

        <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-2xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-elevated md:flex-row md:items-center md:gap-2 md:p-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-secondary px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input type="text" placeholder="Job title or keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-secondary px-4 py-3">
              <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-3 text-base font-semibold rounded-xl">
              Search
            </Button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <span>Popular:</span>
          {(c.popular_tags || []).map((tag) => (
            <button type="button" key={tag} onClick={() => handleTagClick(tag)} className="rounded-full border bg-card px-3 py-1 text-xs transition-colors hover:border-primary hover:text-primary hover:shadow-card">
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
