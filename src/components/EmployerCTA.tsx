import { Building2, Users, BarChart3, ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, LucideIcon> = { Building2, Users, BarChart3 };

type FeatureItem = { icon: string; title: string; desc: string };
type EmployerCTAData = { badge: string; title: string; description: string; button_text: string; features: FeatureItem[] };

type EmployerCTAProps = {
  contentLoading?: boolean;
};

const EmployerCTA = ({ contentLoading = false }: EmployerCTAProps) => {
  const { data, isLoading } = useSiteContent<EmployerCTAData>("employer_cta");
  const showSkeleton = contentLoading || isLoading;
  const badge = data?.badge || "For Employers";
  const title = data?.title || "Are You Hiring?";
  const description = data?.description || "Post your open positions and find the best talent in Bangladesh. Our platform connects you with thousands of job seekers every day.";
  const buttonText = data?.button_text || "Post a Job";
  const features = data?.features || [
    { icon: "Building2", title: "Post Jobs", desc: "Reach thousands of qualified candidates" },
    { icon: "Users", title: "Manage Applicants", desc: "Track and filter applications easily" },
    { icon: "BarChart3", title: "Analytics", desc: "Insights on your job post performance" },
  ];

  return (
    <section className="bg-primary py-16 text-primary-foreground">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            {showSkeleton ? (
              <>
                <Skeleton className="h-8 w-32 rounded-full bg-primary-foreground/10" />
                <Skeleton className="mt-4 h-10 w-3/4 rounded-lg bg-primary-foreground/10" />
                <Skeleton className="mt-3 h-16 w-full rounded-lg bg-primary-foreground/10" />
                <Skeleton className="mt-6 h-12 w-40 rounded-xl bg-primary-foreground/10" />
              </>
            ) : (
              <>
                <span className="inline-block rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                  {badge}
                </span>
                <h2 className="mt-4 text-2xl font-bold md:text-3xl lg:text-4xl">{title}</h2>
                <p className="mt-3 text-primary-foreground/80 md:text-lg leading-relaxed">{description}</p>
                <Button className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.03] active:scale-[0.97] gap-2 px-8 font-semibold rounded-xl text-base transition-transform" asChild>
                  <Link to="/post-job">{buttonText} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                </Button>
              </>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {showSkeleton
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur-sm">
                    <Skeleton className="h-8 w-8 rounded-lg bg-primary-foreground/10" />
                    <Skeleton className="mt-3 h-6 w-20 rounded-lg bg-primary-foreground/10" />
                    <Skeleton className="mt-2 h-4 w-full rounded-lg bg-primary-foreground/10" />
                    <Skeleton className="mt-2 h-4 w-4/5 rounded-lg bg-primary-foreground/10" />
                  </div>
                ))
              : features.map((f) => {
              const Icon = iconMap[f.icon] || Building2;
              return (
                <div key={f.title} className="rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur-sm transition-colors hover:bg-primary-foreground/15">
                  <Icon className="h-8 w-8 text-accent" />
                  <h3 className="mt-3 font-semibold text-lg">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-primary-foreground/70 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmployerCTA;
