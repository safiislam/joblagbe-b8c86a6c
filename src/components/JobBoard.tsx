import { MapPin, Clock, Banknote, Building2, ChevronRight, Briefcase, Search, Filter, X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
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
  "Full-time": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Part-time": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Contract": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Remote": "bg-violet-500/10 text-violet-600 border-violet-500/20",
  "Internship": "bg-pink-500/10 text-pink-600 border-pink-500/20",
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
}) => (
  <button
    onClick={onClick}
    className={`group w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
      isSelected
        ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
        : "bg-card hover:border-primary/30 hover:shadow-md"
    }`}
  >
    <div className="flex gap-3">
      {/* Company logo */}
      <div className="shrink-0">
        {job.companies?.logo_url ? (
          <img
            src={job.companies.logo_url}
            alt=""
            className="h-12 w-12 rounded-xl border bg-secondary object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-secondary">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/jobs/${job.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1"
          >
            {job.title}
          </Link>
          <div className="flex items-center gap-0.5 shrink-0">
            <SaveJobButton jobId={job.id} saved={savedJobIds?.has(job.id)} />
            <ShareJobButton jobTitle={job.title} jobId={job.id} />
          </div>
        </div>

        <Link
          to={`/company/${job.company_id}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {job.companies?.name}
          {job.companies?.is_verified && <VerifiedBadge className="h-3.5 w-3.5" />}
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Job type badge */}
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${typeColorMap[job.job_type] || "bg-secondary text-muted-foreground"}`}>
            {job.job_type}
          </span>
          {(() => { const dt = getJobDisplayTag(job.tag, job.created_at); return dt ? (
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
              dt === "Urgent"
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-accent/15 text-accent border border-accent/20"
            }`}>
              {dt}
            </span>
          ) : null; })()}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {job.location}
          </span>
          <span className="flex items-center gap-1 font-medium text-foreground/70">
            <Banknote className="h-3 w-3 shrink-0" />
            {formatSalary(job.salary_min, job.salary_max)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  </button>
);

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
        .limit(20);

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
    <section className="py-16" id="jobs">
      <div className="container">
        {/* Section header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl font-bangla">সর্বশেষ চাকরি</h2>
            <p className="mt-1 text-muted-foreground">Hand-picked opportunities updated daily</p>
          </div>
          <Button
            variant="outline"
            className="gap-2 self-start sm:self-auto rounded-xl"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Filters"}
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">!</span>
            )}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-6 rounded-2xl border bg-card p-4 shadow-sm animate-fade-in" style={{ animationDuration: "0.2s" }}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Job title or keyword" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <input type="text" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="Location" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              </div>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger className="rounded-xl bg-secondary border-0"><SelectValue placeholder="Job Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="rounded-xl bg-secondary border-0"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <div className="mt-3 flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-destructive hover:text-destructive">
                  <X className="h-3 w-3" /> Clear all filters
                </Button>
                <span className="text-xs text-muted-foreground">{jobs?.length ?? 0} results found</span>
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-5">
            <div className="space-y-3 lg:col-span-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 rounded-2xl border bg-card p-4">
                  <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden h-96 animate-pulse rounded-2xl border bg-muted lg:col-span-3 lg:block" />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            {/* Job list */}
            <div className="space-y-3 lg:col-span-2 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
              {jobs?.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJob?.id === job.id}
                  onClick={() => setSelectedJob(job)}
                  savedJobIds={savedJobIds}
                />
              ))}
              {jobs?.length === 0 && (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Briefcase className="h-7 w-7 opacity-40" />
                  </div>
                  <p className="mt-4 font-semibold text-foreground">No jobs found</p>
                  <p className="mt-1 text-sm">Try adjusting your search or filters</p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3 gap-1 rounded-xl">
                      <X className="h-3 w-3" /> Clear filters
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Desktop detail panel */}
            <div className="hidden rounded-2xl border bg-card shadow-sm lg:col-span-3 lg:block sticky top-20 self-start overflow-hidden">
              {selectedJob ? (
                <div className="max-h-[640px] overflow-y-auto">
                  {/* Header area with subtle gradient */}
                  <div className="border-b bg-gradient-to-br from-primary/5 to-transparent p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-4">
                        {selectedJob.companies?.logo_url ? (
                          <img src={selectedJob.companies.logo_url} alt="" className="h-14 w-14 rounded-xl border bg-card object-cover shrink-0" />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-card shrink-0">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold leading-tight">{selectedJob.title}</h3>
                          <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                            <Link to={`/company/${selectedJob.company_id}`} className="hover:text-primary font-medium transition-colors inline-flex items-center gap-1">
                              {selectedJob.companies?.name}
                              {selectedJob.companies?.is_verified && <VerifiedBadge />}
                            </Link>
                            <span className="text-border">•</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selectedJob.location}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <SaveJobButton jobId={selectedJob.id} saved={savedJobIds?.has(selectedJob.id)} />
                        <ShareJobButton jobTitle={selectedJob.title} jobId={selectedJob.id} />
                        <button
                          onClick={() => setSelectedJob(null)}
                          className="ml-1 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="বন্ধ করুন"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-sm font-medium ${typeColorMap[selectedJob.job_type] || "bg-secondary"}`}>
                        {selectedJob.job_type}
                      </span>
                      <span className="rounded-full border bg-secondary px-3 py-1 text-sm font-semibold">
                        {formatSalary(selectedJob.salary_min, selectedJob.salary_max)}
                      </span>
                      <span className="rounded-full border bg-secondary px-3 py-1 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(selectedJob.created_at), { addSuffix: true })}
                      </span>
                      {(() => { const dt = getJobDisplayTag(selectedJob.tag, selectedJob.created_at); return dt ? (
                        <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                          dt === "Urgent"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-accent/15 text-accent"
                        }`}>
                          {dt}
                        </span>
                      ) : null; })()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Job Description</h4>
                      <p className="mt-3 leading-relaxed text-foreground/80 whitespace-pre-line">{selectedJob.description}</p>
                    </div>
                    {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Requirements</h4>
                        <ul className="mt-3 space-y-2">
                          {selectedJob.requirements.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground/80">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <JobFraudWarning />
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={() => handleApply(selectedJob.id)}
                        className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 text-base font-semibold rounded-xl gap-2"
                      >
                        Apply Now <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="rounded-xl" asChild>
                        <Link to={`/jobs/${selectedJob.id}`}>View Full Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-muted-foreground p-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                    <Briefcase className="h-9 w-9 opacity-30" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-foreground/60">Select a job to view details</p>
                  <p className="mt-1 text-sm">Click on any job card from the list</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile detail modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-sm lg:hidden" onClick={() => setSelectedJob(null)}>
            <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="mx-auto h-1 w-10 rounded-full bg-border" />
                <button
                  onClick={() => setSelectedJob(null)}
                  className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-start gap-3">
                {selectedJob.companies?.logo_url ? (
                  <img src={selectedJob.companies.logo_url} alt="" className="h-12 w-12 rounded-xl border object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-secondary">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold">{selectedJob.title}</h3>
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-1">{selectedJob.companies?.name} {selectedJob.companies?.is_verified && <VerifiedBadge className="h-3.5 w-3.5" />} · {selectedJob.location}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-sm font-medium ${typeColorMap[selectedJob.job_type] || "bg-secondary"}`}>
                  {selectedJob.job_type}
                </span>
                <span className="rounded-full border bg-secondary px-3 py-1 text-sm font-semibold">
                  {formatSalary(selectedJob.salary_min, selectedJob.salary_max)}
                </span>
              </div>
              <p className="mt-4 leading-relaxed text-muted-foreground whitespace-pre-line">{selectedJob.description}</p>
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {selectedJob.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
              <JobFraudWarning className="mt-4" />
              <div className="mt-6 flex gap-3">
                <Button onClick={() => handleApply(selectedJob.id)} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl py-3 gap-2">
                  Apply Now <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="rounded-xl" asChild>
                  <Link to={`/jobs/${selectedJob.id}`}>Details</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button variant="outline" className="gap-2 rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6" asChild>
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
