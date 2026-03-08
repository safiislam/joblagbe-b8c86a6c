import { MapPin, Clock, Banknote, Building2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  tag?: "New" | "Urgent";
  posted: string;
  description: string;
};

const JOBS: Job[] = [
  { id: 1, title: "Senior Software Engineer", company: "Grameenphone", location: "Dhaka", salary: "৳80,000 - ৳120,000", type: "Full-time", tag: "New", posted: "2 hours ago", description: "We are looking for an experienced software engineer to join our digital team. You'll work on large-scale systems serving millions of users." },
  { id: 2, title: "Marketing Manager", company: "Walton Group", location: "Gazipur", salary: "৳60,000 - ৳90,000", type: "Full-time", tag: "Urgent", posted: "5 hours ago", description: "Lead our brand marketing initiatives across digital and traditional channels for the domestic market." },
  { id: 3, title: "UI/UX Designer", company: "bKash", location: "Dhaka", salary: "৳50,000 - ৳75,000", type: "Full-time", tag: "New", posted: "1 day ago", description: "Design user interfaces and experiences for our mobile financial services platform used by millions." },
  { id: 4, title: "Accountant", company: "BRAC Bank", location: "Chittagong", salary: "৳40,000 - ৳55,000", type: "Full-time", posted: "2 days ago", description: "Manage financial records and reporting for our Chittagong regional branch operations." },
  { id: 5, title: "Data Analyst", company: "Robi Axiata", location: "Dhaka", salary: "৳55,000 - ৳80,000", type: "Contract", tag: "New", posted: "3 hours ago", description: "Analyze telecom data to derive business insights and support strategic decision making." },
  { id: 6, title: "Civil Engineer", company: "Bashundhara Group", location: "Dhaka", salary: "৳45,000 - ৳70,000", type: "Full-time", posted: "1 day ago", description: "Oversee construction projects for our real estate division across the country." },
];

const JobBoard = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  return (
    <section className="py-16" id="jobs">
      <div className="container">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Latest Jobs</h2>
            <p className="mt-1 text-muted-foreground">Hand-picked opportunities updated daily</p>
          </div>
          <Button variant="ghost" className="hidden text-primary md:flex">
            View all jobs <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          {/* Job List */}
          <div className="space-y-3 lg:col-span-2">
            {JOBS.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`w-full rounded-xl border p-4 text-left transition-all hover:shadow-card ${
                  selectedJob?.id === job.id ? "border-primary bg-primary/5 shadow-card" : "bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug">{job.title}</h3>
                  {job.tag && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      job.tag === "Urgent" ? "bg-accent/15 text-accent" : "bg-success/15 text-success"
                    }`}>
                      {job.tag}
                    </span>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> {job.company}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                  <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />{job.salary}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.posted}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Job Detail Panel */}
          <div className="hidden rounded-xl border bg-card p-6 shadow-card lg:col-span-3 lg:block">
            {selectedJob ? (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{selectedJob.title}</h3>
                    <p className="mt-1 text-muted-foreground">{selectedJob.company} · {selectedJob.location}</p>
                  </div>
                  {selectedJob.tag && (
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      selectedJob.tag === "Urgent" ? "bg-accent/15 text-accent" : "bg-success/15 text-success"
                    }`}>
                      {selectedJob.tag}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="rounded-full bg-secondary px-3 py-1 text-sm">{selectedJob.type}</span>
                  <span className="rounded-full bg-secondary px-3 py-1 text-sm">{selectedJob.salary}</span>
                  <span className="rounded-full bg-secondary px-3 py-1 text-sm">{selectedJob.posted}</span>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold">Job Description</h4>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{selectedJob.description}</p>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold">Requirements</h4>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                    <li>Bachelor's degree in a relevant field</li>
                    <li>3+ years of professional experience</li>
                    <li>Strong communication skills in Bengali and English</li>
                    <li>Ability to work collaboratively in a team</li>
                  </ul>
                </div>

                <Button className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 px-8 text-base font-semibold">
                  Apply Now
                </Button>
              </div>
            ) : (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-muted-foreground">
                <Building2 className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-lg font-medium">Select a job to view details</p>
                <p className="text-sm">Click on any job card from the list</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile detail modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 lg:hidden" onClick={() => setSelectedJob(null)}>
            <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
              <h3 className="text-lg font-bold">{selectedJob.title}</h3>
              <p className="text-muted-foreground">{selectedJob.company} · {selectedJob.location}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-sm">{selectedJob.type}</span>
                <span className="rounded-full bg-secondary px-3 py-1 text-sm">{selectedJob.salary}</span>
              </div>
              <p className="mt-4 leading-relaxed text-muted-foreground">{selectedJob.description}</p>
              <Button className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                Apply Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default JobBoard;
