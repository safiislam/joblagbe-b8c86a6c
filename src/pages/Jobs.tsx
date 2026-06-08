import SeoHead from "@/components/SeoHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Search, Clock, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { formatDistanceToNow } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";
import { getJobDisplayTag } from "@/lib/jobTag";
import { AffiliateSidebarAd, AffiliateInContentAd, AffiliateCarousel } from "@/components/AffiliateAds";
import { Button } from "@/components/ui/button";

const JOBS_PER_PAGE = 20;

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [jobType, setJobType] = useState("all");
  const [location, setLocation] = useState(searchParams.get("location") || "all");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  const [page, setPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, jobType, location, categoryFilter]);

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    const loc = searchParams.get("location");
    if (loc) setLocation(loc);
    const cat = searchParams.get("category");
    if (cat) setCategoryFilter(cat);
  }, [searchParams]);

  // Build the query with server-side filtering + pagination
  const { data, isLoading } = useQuery({
    queryKey: ["all-jobs", search, jobType, location, categoryFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*, companies:companies_public(name, logo_url, is_verified), categories(name)", { count: "exact" })
        .eq("is_active", true)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      // Server-side filters
      if (jobType !== "all") {
        query = query.eq("job_type", jobType);
      }
      if (location !== "all") {
        query = query.ilike("location", `%${location}%`);
      }
      if (categoryFilter !== "all") {
        query = query.eq("category_id", categoryFilter);
      }
      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      // Pagination
      const from = (page - 1) * JOBS_PER_PAGE;
      const to = from + JOBS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: jobs, error, count } = await query;
      return { jobs: jobs ?? [], totalCount: count ?? 0 };
    },
  });

  const jobs = data?.jobs ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / JOBS_PER_PAGE);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
    staleTime: 30 * 60 * 1000,
  });

  // Fetch distinct job types and locations for filter dropdowns
  const { data: filterOptions } = useQuery({
    queryKey: ["job-filter-options"],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("job_type, location")
        .eq("is_active", true)
        .eq("is_approved", true);
      const types = [...new Set(data?.map((j) => j.job_type) ?? [])];
      const locs = [...new Set(
        data?.flatMap((j) => j.location?.split(",").map((l) => l.trim()).filter(Boolean) ?? []) ?? []
      )].sort();
      return { types, locations: locs };
    },
    staleTime: 30 * 60 * 1000,
  });

  const jobTypes = filterOptions?.types ?? [];
  const locations = filterOptions?.locations ?? [];

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="সকল নিয়োগ বিজ্ঞপ্তি — সরকারি ও বেসরকারি চাকরি"
        description="বাংলাদেশের সরকারি-বেসরকারি সকল চাকরির বিজ্ঞপ্তি খুঁজুন। ফুলটাইম, পার্টটাইম, রিমোট চাকরি এক জায়গায়।"
        jsonLd={jobs.length > 0 ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: jobs.slice(0, 10).map((j: any, i: number) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://www.joblagbe.bd/jobs/${j.id}`,
            name: j.title,
          })),
        } : undefined}
      />
      <Header />
      <div className="container py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-bangla">সকল নিয়োগ বিজ্ঞপ্তি</h1>
          <p className="mt-2 text-muted-foreground">সরকারি-বেসরকারি সকল চাকরির বিজ্ঞপ্তি এক জায়গায়</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="চাকরি বা প্রতিষ্ঠানের নাম খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="চাকরির ধরন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল ধরন</SelectItem>
              {jobTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="লোকেশন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল লোকেশন</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="ক্যাটাগরি" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল ক্যাটাগরি</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <p className="mb-4 text-sm text-muted-foreground">{totalCount} টি চাকরি পাওয়া গেছে</p>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job, index) => (
                  <div key={job.id}>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="group flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-card transition-all hover:shadow-elevated hover:border-primary/30 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          {(job.companies as any)?.logo_url ? (
                            <img src={(job.companies as any).logo_url} alt="" className="h-8 w-8 rounded object-contain" />
                          ) : (
                            <Building2 className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{job.title}</h3>
                          <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
                            {(job.companies as any)?.name}
                            {(job.companies as any)?.is_verified && <VerifiedBadge className="h-3.5 w-3.5" />}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(job as any).post_type === "circular" && (
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20">📋 সার্কুলার</Badge>
                            )}
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <MapPin className="h-3 w-3" /> {job.location}
                            </Badge>
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Briefcase className="h-3 w-3" /> {job.job_type}
                            </Badge>
                            {(() => { const dt = getJobDisplayTag(job.tag, job.created_at); return dt ? <Badge className="text-xs">{dt}</Badge> : null; })()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground sm:flex-col sm:items-end">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </span>
                        {job.salary_min && (
                          <span className="font-semibold text-foreground">
                            ৳{job.salary_min.toLocaleString()}{job.salary_max ? ` - ৳${job.salary_max.toLocaleString()}` : "+"}
                          </span>
                        )}
                      </div>
                    </Link>
                    {(index + 1) % 5 === 0 && <div className="mt-4"><AffiliateInContentAd /></div>}
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" /> আগের
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-9"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="gap-1"
                    >
                      পরের <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-20 text-muted-foreground">
                <Briefcase className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-lg font-medium font-bangla">কোনো চাকরি পাওয়া যায়নি</p>
              </div>
            )}

            <AffiliateCarousel />
          </div>

          {/* Sidebar Ads */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-6">
            <AffiliateSidebarAd placement="sidebar" />
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Jobs;
