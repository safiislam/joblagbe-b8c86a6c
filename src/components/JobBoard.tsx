import { MapPin, Clock, Banknote, Building2, ChevronRight, Briefcase, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
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
  companies: { name: string; location: string | null } | null;
};

const formatSalary = (min: number | null, max: number | null) => {
  if (!min && !max) return "Negotiable";
  if (min && max) return `৳${min.toLocaleString()} - ৳${max.toLocaleString()}`;
  if (min) return `From ৳${min.toLocaleString()}`;
  return `Up to ৳${max!.toLocaleString()}`;
};

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Remote", "Internship"];

const JobBoard = () => {
  const [selectedJob, setSelectedJob] = useState<JobRow | null>(null);
  const [keyword, setKeyword] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobType, setJobType] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", keyword, locationFilter, jobType, categoryId],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*, companies(name, location)")
        .eq("is_active", true)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (keyword.trim()) {
        query = query.ilike("title", `%${keyword.trim()}%`);
      }
      if (locationFilter.trim()) {
        query = query.ilike("location", `%${locationFilter.trim()}%`);
      }
      if (jobType !== "all") {
        query = query.eq("job_type", jobType);
      }
      if (categoryId !== "all") {
        query = query.eq("category_id", categoryId);
      }

      const { data } = await query;
      return (data as unknown as JobRow[]) ?? [];
    },
  });

  const handleApply = async (jobId: string) => {
    if (!user) {
      toast.error("Please login to apply");
      navigate("/login");
      return;
    }
    const { error } = await supabase.from("applications").insert({ job_id: jobId, user_id: user.id });
    if (error) {
      if (error.code === "23505") toast.info("You already applied to this job");
      else toast.error(error.message);
    } else {
      toast.success("Application submitted!");
    }
  };

  const hasActiveFilters = keyword || locationFilter || jobType !== "all" || categoryId !== "all";

  const clearFilters = () => {
    setKeyword("");
    setLocationFilter("");
    setJobType("all");
    setCategoryId("all");
  };

  return (
    <section className="py-16" id="jobs">
      <div className="container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl font-bangla">সর্বশেষ চাকরি</h2>
            <p className="mt-1 text-muted-foreground">Hand-picked opportunities updated daily</p>
          </div>
          <Button
            variant="outline"
            className="gap-2 self-start sm:self-auto"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Filters"}
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">!</span>
            )}
          </Button>
        </div>

        {/* Search & Filter bar */}
        {showFilters && (
          <div className="mt-6 rounded-2xl border bg-card p-4 shadow-card animate-fade-in" style={{ animationDuration: "0.2s" }}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Job title or keyword"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Location"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
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

        {isLoading ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-5">
            <div className="space-y-3 lg:col-span-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl border bg-muted" />
              ))}
            </div>
            <div className="hidden h-96 animate-pulse rounded-2xl border bg-muted lg:col-span-3 lg:block" />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            {/* Job list */}
            <div className="space-y-3 lg:col-span-2 max-h-[600px] overflow-y-auto pr-1">
              {jobs?.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all hover:shadow-card ${
                    selectedJob?.id === job.id
                      ? "border-primary bg-primary/5 shadow-card ring-1 ring-primary/20"
                      : "bg-card hover:border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{job.title}</h3>
                    {job.tag && (
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        job.tag === "Urgent" ? "bg-accent/15 text-accent" : "bg-success/15 text-success"
                      }`}>
                        {job.tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" /> {job.companies?.name}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                    <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />{formatSalary(job.salary_min, job.salary_max)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                  </div>
                </button>
              ))}
              {jobs?.length === 0 && (
                <div className="flex flex-col items-center py-14 text-muted-foreground">
                  <Briefcase className="mb-3 h-10 w-10 opacity-30" />
                  <p className="font-medium">No jobs found</p>
                  <p className="mt-1 text-sm">Try adjusting your filters</p>
                </div>
              )}
            </div>

            {/* Desktop detail panel */}
            <div className="hidden rounded-2xl border bg-card p-6 shadow-card lg:col-span-3 lg:block sticky top-20 self-start">
              {selectedJob ? (
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{selectedJob.title}</h3>
                      <p className="mt-1 text-muted-foreground">{selectedJob.companies?.name} · {selectedJob.location}</p>
                    </div>
                    {selectedJob.tag && (
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        selectedJob.tag === "Urgent" ? "bg-accent/15 text-accent" : "bg-success/15 text-success"
                      }`}>
                        {selectedJob.tag}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">{selectedJob.job_type}</span>
                    <span className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">{formatSalary(selectedJob.salary_min, selectedJob.salary_max)}</span>
                    <span className="rounded-full bg-secondary px-3 py-1.5 text-sm">{formatDistanceToNow(new Date(selectedJob.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="mt-6">
                    <h4 className="font-semibold">Job Description</h4>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{selectedJob.description}</p>
                  </div>
                  {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold">Requirements</h4>
                      <ul className="mt-2 list-inside list-disc space-y-1.5 text-muted-foreground">
                        {selectedJob.requirements.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  <Button
                    onClick={() => handleApply(selectedJob.id)}
                    className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 px-8 text-base font-semibold rounded-xl"
                  >
                    Apply Now
                  </Button>
                </div>
              ) : (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-muted-foreground">
                  <Briefcase className="mb-3 h-12 w-12 opacity-20" />
                  <p className="text-lg font-medium">Select a job to view details</p>
                  <p className="text-sm">Click on any job card from the list</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile detail modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-sm lg:hidden" onClick={() => setSelectedJob(null)}>
            <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
              <h3 className="text-lg font-bold">{selectedJob.title}</h3>
              <p className="text-muted-foreground">{selectedJob.companies?.name} · {selectedJob.location}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-sm">{selectedJob.job_type}</span>
                <span className="rounded-full bg-secondary px-3 py-1 text-sm">{formatSalary(selectedJob.salary_min, selectedJob.salary_max)}</span>
              </div>
              <p className="mt-4 leading-relaxed text-muted-foreground">{selectedJob.description}</p>
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <ul className="mt-4 list-inside list-disc space-y-1 text-muted-foreground">
                  {selectedJob.requirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
              <Button
                onClick={() => handleApply(selectedJob.id)}
                className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl py-3"
              >
                Apply Now
              </Button>
            </div>
          </div>
        )}

        {/* Mobile view all */}
        <div className="mt-6 text-center lg:hidden">
          <Button variant="outline" className="gap-1 border-primary text-primary">
            View all jobs <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default JobBoard;
