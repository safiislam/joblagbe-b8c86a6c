import { MapPin, Clock, Banknote, Building2, ChevronRight, Briefcase, Search, Filter, X, ArrowRight, CalendarDays } from "lucide-react";
import { optimizeStorageImage } from "@/lib/imageOptimize";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import SaveJobButton from "@/components/SaveJobButton";
import ShareJobButton from "@/components/ShareJobButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import ApplyJobDialog from "@/components/ApplyJobDialog";
import JobFraudWarning from "@/components/JobFraudWarning";
import { getJobDisplayTag } from "@/lib/jobTag";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type JobRow = {
  id: string;
  title: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  job_type: string;
  tag: string | null;
  description: string;
  requirements: string[] | null;
  created_at: string;
  category_id: string | null;
  company_id: string;
  hide_apply: boolean;
  application_deadline: string | null;
  post_type?: string | null;
  circular_image_url?: string | null;
  source_url?: string | null;
  companies: { name: string; location: string | null; logo_url: string | null; is_verified: boolean } | null;
};

const formatSalary = (min: number | null, max: number | null) => {
  if (!min && !max) return "Negotiable";
  if (min && max) return `৳${min.toLocaleString()} - ৳${max.toLocaleString()}`;
  if (min) return `From ৳${min.toLocaleString()}`;
  return `Up to ৳${max!.toLocaleString()}`;
};

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Remote", "Internship"];

const typeColorMap: Record<string, string> = {
  "Full-time": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "Part-time": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "Contract": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "Remote": "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  "Internship": "bg-pink-500/10 text-pink-700 dark:text-pink-400",
};

const JobCard = ({
  job,
  isSelected,
  onClick,
  savedJobIds,
}: {
  job: JobRow;
  isSelected: boolean;
  onClick: () => void;
  savedJobIds?: Set<string>;
}) => {
  const displayTag = getJobDisplayTag(job.tag, job.created_at);
  const isCircular = job.post_type === "circular" && !!job.circular_image_url;

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left transition-all duration-200 rounded-xl border p-4 hover:-translate-y-0.5 ${
        isSelected
          ? "border-primary/50 bg-primary/[0.03] shadow-md ring-1 ring-primary/20"
          : "border-border/60 bg-card hover:border-primary/30 hover:shadow-elevated"
      }`}
    >
      {/* Tag ribbon */}
      {displayTag && (
        <div className={`absolute -top-0 right-3 rounded-b-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          displayTag === "Urgent"
            ? "bg-destructive text-destructive-foreground"
            : "bg-accent text-accent-foreground"
        }`}>
          {displayTag}
        </div>
      )}

      {isCircular && (
        <div className="mb-3 -mx-1 overflow-hidden rounded-lg border bg-secondary/30">
          <img
            src={optimizeStorageImage(job.circular_image_url!, { width: 800 })}
            alt={job.title}
            className="w-full max-h-48 object-contain bg-background"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute top-2 left-2">
            <span className="rounded-md bg-primary/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              সার্কুলার
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-3.5">
        {/* Logo */}
        <div className="shrink-0 mt-0.5">
          {job.companies?.logo_url ? (
            <img
              src={optimizeStorageImage(job.companies.logo_url, { width: 96, height: 96 })}
              alt=""
              className="h-11 w-11 rounded-lg border bg-background object-cover"
              width={44}
              height={44}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border bg-muted/50">
              <Building2 className="h-5 w-5 text-muted-foreground/60" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-1.5">
            <Link
              to={`/jobs/${job.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-[15px] leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2"
            >
              {job.title}
            </Link>
            <div className="flex items-center shrink-0 -mr-1">
              <SaveJobButton jobId={job.id} saved={savedJobIds?.has(job.id)} />
              <ShareJobButton jobTitle={job.title} jobId={job.id} />
            </div>
          </div>

          {/* Company */}
          <Link
            to={`/company/${job.company_id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-primary transition-colors"
          >
            {job.companies?.name}
            {job.companies?.is_verified && <VerifiedBadge className="h-3.5 w-3.5" />}
          </Link>

          {/* Type badge */}
          <div className="mt-2">
            <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${typeColorMap[job.job_type] || "bg-secondary text-muted-foreground"}`}>
              {job.job_type}
            </span>
          </div>

          {/* Meta info */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
              <span className="line-clamp-1">{job.location}</span>
            </span>
            <span className="flex items-center gap-1 font-medium text-foreground/70">
              <Banknote className="h-3 w-3 shrink-0 text-muted-foreground/70" />
              {formatSalary(job.salary_min, job.salary_max)}
            </span>
          </div>

          {/* Footer row: time + deadline */}
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground/70">
            <span className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </span>
            {job.application_deadline && (
              <span className={`flex items-center gap-1 font-semibold ${new Date(job.application_deadline) < new Date() ? "text-destructive/80" : "text-accent"}`}>
                <CalendarDays className="h-2.5 w-2.5" />
                ডেডলাইন: {format(new Date(job.application_deadline), "dd MMM")}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

const JobBoard = () => {
  const [selectedJob, setSelectedJob] = useState<JobRow | null>(null);
  const [keyword, setKeyword] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobType, setJobType] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: savedJobIds } = useQuery({
    queryKey: ["saved-job-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("saved_jobs").select("job_id").eq("user_id", user!.id);
      return new Set(data?.map((s) => s.job_id) ?? []);
    },
    enabled: !!user,
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", keyword, locationFilter, jobType, categoryId],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*, companies(name, location, logo_url, is_verified)")
        .eq("is_active", true)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (keyword.trim()) query = query.ilike("title", `%${keyword.trim()}%`);
      if (locationFilter.trim()) query = query.ilike("location", `%${locationFilter.trim()}%`);
      if (jobType !== "all") query = query.eq("job_type", jobType);
      if (categoryId !== "all") query = query.eq("category_id", categoryId);

      const { data } = await query;
      return (data as unknown as JobRow[]) ?? [];
    },
  });

  const applyJob = jobs?.find((j) => j.id === applyJobId) || selectedJob;

  const handleApply = (jobId: string) => {
    if (!user) { toast.error("আবেদন করতে লগইন করুন"); navigate("/login"); return; }
    setApplyJobId(jobId);
  };

  const hasActiveFilters = keyword || locationFilter || jobType !== "all" || categoryId !== "all";
  const clearFilters = () => { setKeyword(""); setLocationFilter(""); setJobType("all"); setCategoryId("all"); };

  return (
    <section className="py-14 lg:py-20" id="jobs">
      <div className="container">
        {/* Section header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl font-bangla">সর্বশেষ চাকরি</h2>
            <p className="mt-1 text-sm text-muted-foreground">Hand-picked opportunities updated daily</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 self-start sm:self-auto rounded-lg"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5" />
            {showFilters ? "Hide Filters" : "Filters"}
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">!</span>
            )}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-5 rounded-xl border bg-card/80 backdrop-blur-sm p-4 shadow-sm animate-fade-in" style={{ animationDuration: "0.2s" }}>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Job title or keyword" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50" />
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                <MapPin className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <input type="text" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="Location" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50" />
              </div>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Job Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <div className="mt-2.5 flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 gap-1 text-xs text-destructive hover:text-destructive">
                  <X className="h-3 w-3" /> Clear all
                </Button>
                <span className="text-xs text-muted-foreground">{jobs?.length ?? 0} results</span>
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-shimmer-none">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-3.5 rounded-xl border p-4">
                <div className="h-11 w-11 rounded-lg animate-shimmer" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 w-3/4 rounded animate-shimmer" />
                  <div className="h-3 w-1/3 rounded animate-shimmer" />
                  <div className="h-5 w-16 rounded-md animate-shimmer" />
                  <div className="h-3 w-2/3 rounded animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs?.map((job) => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                  <JobCard
                    job={job}
                    isSelected={false}
                    onClick={() => {}}
                    savedJobIds={savedJobIds}
                  />
                </Link>
              ))}
              {jobs?.length === 0 && (
                <div className="flex flex-col items-center py-20 text-muted-foreground">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted/50">
                    <Briefcase className="h-6 w-6 opacity-30" />
                  </div>
                  <p className="mt-3 font-semibold text-foreground/60">No jobs found</p>
                  <p className="mt-1 text-sm">Try adjusting your search or filters</p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3 gap-1 rounded-lg text-xs">
                      <X className="h-3 w-3" /> Clear filters
                    </Button>
                  )}
                </div>
              )}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button variant="outline" className="gap-2 rounded-lg border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground px-6" asChild>
            <Link to="/jobs">
              সব চাকরি দেখুন <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Apply Dialog */}
        {applyJob && (
          <ApplyJobDialog
            open={!!applyJobId}
            onOpenChange={(open) => { if (!open) setApplyJobId(null); }}
            jobId={applyJob.id}
            jobTitle={applyJob.title}
            companyName={applyJob.companies?.name ?? undefined}
            companyId={applyJob.company_id}
          />
        )}
      </div>
    </section>
  );
};

export default JobBoard;
