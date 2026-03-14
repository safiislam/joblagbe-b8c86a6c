import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Search, Clock, Building2 } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { formatDistanceToNow } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";

const Jobs = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [jobType, setJobType] = useState("all");
  const [location, setLocation] = useState(searchParams.get("location") || "all");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    const loc = searchParams.get("location");
    if (loc) setLocation(loc);
    const cat = searchParams.get("category");
    if (cat) setCategoryFilter(cat);
  }, [searchParams]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["all-jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*, companies(name, logo_url, is_verified), categories(name)")
        .eq("is_active", true)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

  const jobTypes = [...new Set(jobs?.map((j) => j.job_type) ?? [])];
  const locations = useMemo(() => {
    const locs = jobs?.map((j) => j.location).filter(Boolean) ?? [];
    return [...new Set(locs)].sort();
  }, [jobs]);

  const filtered = jobs?.filter((job) => {
    const matchSearch =
      !search ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      (job.companies as any)?.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = jobType === "all" || job.job_type === jobType;
    const matchLoc = location === "all" || job.location?.toLowerCase().includes(location.toLowerCase());
    const matchCat = categoryFilter === "all" || job.category_id === categoryFilter;
    return matchSearch && matchType && matchLoc && matchCat;
  });

  return (
    <div className="min-h-screen bg-background">
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

        <p className="mb-4 text-sm text-muted-foreground">{filtered?.length ?? 0} টি চাকরি পাওয়া গেছে</p>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((job) => (
              <Link
                to={`/jobs/${job.id}`}
                key={job.id}
                className="group flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-card transition-all hover:shadow-elevated hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
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
                    <p className="text-sm text-muted-foreground">{(job.companies as any)?.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </Badge>
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Briefcase className="h-3 w-3" /> {job.job_type}
                      </Badge>
                      {job.tag && <Badge className="text-xs">{job.tag}</Badge>}
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
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-muted-foreground">
            <Briefcase className="mb-3 h-12 w-12 opacity-30" />
            <p className="text-lg font-medium font-bangla">কোনো চাকরি পাওয়া যায়নি</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Jobs;
