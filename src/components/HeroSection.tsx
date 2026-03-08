import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-24">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(hsl(var(--primary)) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      <div className="container relative text-center">
        <h1 className="mx-auto max-w-3xl font-bangla text-3xl font-bold leading-tight text-foreground md:text-5xl animate-fade-in">
          আপনার ক্যারিয়ারের পরবর্তী ধাপ শুরু হোক এখানে
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Thousands of jobs from top employers across Bangladesh. Find your dream career today.
        </p>

        <div className="mx-auto mt-8 max-w-2xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-elevated md:flex-row md:items-center md:gap-2 md:p-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-secondary px-3 py-2.5">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Job title or keyword"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-secondary px-3 py-2.5">
              <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Location"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-2.5 text-base font-semibold rounded-lg">
              Search
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <span>Popular:</span>
          {["Software Engineer", "Marketing", "Accountant", "Designer"].map((tag) => (
            <button key={tag} className="rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary hover:text-primary">
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
