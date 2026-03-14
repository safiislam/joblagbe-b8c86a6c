import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Building2, MapPin, Globe } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";

const Companies = () => {
  const { data: companies, isLoading } = useQuery({
    queryKey: ["all-companies"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").order("name");
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-bangla">কোম্পানি সমূহ</h1>
          <p className="mt-2 text-muted-foreground">Browse companies hiring on Job Lagbe</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies?.map((c) => (
              <Link
                key={c.id}
                to={`/company/${c.id}`}
                className="group flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={c.name} className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold group-hover:text-primary transition-colors inline-flex items-center gap-1">
                    {c.name}
                    {c.is_verified && <VerifiedBadge className="h-4 w-4" />}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {c.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>}
                    {c.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />Website</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Companies;
