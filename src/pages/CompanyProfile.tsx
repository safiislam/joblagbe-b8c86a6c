import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, Globe, Briefcase, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const CompanyProfile = () => {
  const { id } = useParams();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").eq("id", id).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: jobs } = useQuery({
    queryKey: ["company-jobs", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, location, job_type, salary_min, salary_max, created_at, tag")
        .eq("company_id", id!)
        .eq("is_active", true)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!id,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> হোমে ফিরুন
        </Link>

        {isLoading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-muted" />
        ) : company ? (
          <>
            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <Building2 className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{company.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {company.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{company.location}</span>
                    )}
                    {company.phone && (
                      <a href={`tel:${company.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                        <Phone className="h-3.5 w-3.5" />{company.phone}
                      </a>
                    )}
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noopener" className="flex items-center gap-1 text-primary hover:underline">
                        <Globe className="h-3.5 w-3.5" />{company.website}
                      </a>
                    )}
                  </div>
                  {company.description && (
                    <p className="mt-3 text-muted-foreground leading-relaxed">{company.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Open Positions ({jobs?.length ?? 0})
              </h2>
              <div className="space-y-3">
                {jobs && jobs.length > 0 ? (
                  jobs.map((job) => (
                    <div key={job.id} className="rounded-2xl border bg-card p-4 shadow-card transition-all hover:shadow-elevated">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{job.title}</h3>
                          <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                            <Badge variant="outline" className="text-[10px]">{job.job_type}</Badge>
                            <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                        {job.tag && (
                          <Badge className={job.tag === "Urgent" ? "bg-accent/15 text-accent border-0" : "bg-success/15 text-success border-0"}>
                            {job.tag}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-muted-foreground">
                    <p>No open positions right now</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg font-medium">Company not found</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CompanyProfile;
