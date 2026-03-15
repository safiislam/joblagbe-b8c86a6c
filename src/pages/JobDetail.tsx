import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import SaveJobButton from "@/components/SaveJobButton";
import ShareJobButton from "@/components/ShareJobButton";
import {
  MapPin, Briefcase, Clock, Banknote, Building2, Phone, Globe,
  ArrowLeft, CheckCircle2, FileText, Loader2, Upload, File
} from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import JobFraudWarning from "@/components/JobFraudWarning";
import { formatDistanceToNow, format } from "date-fns";

const formatSalary = (min: number | null, max: number | null) => {
  if (!min && !max) return "আলোচনা সাপেক্ষে";
  if (min && max) return `৳${min.toLocaleString()} - ৳${max.toLocaleString()}`;
  if (min) return `৳${min.toLocaleString()} থেকে`;
  return `৳${max!.toLocaleString()} পর্যন্ত`;
};

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, companies(name, location, logo_url, phone, website, description, is_verified), categories(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: existingApplication } = useQuery({
    queryKey: ["application-check", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status, created_at")
        .eq("job_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: savedJobIds } = useQuery({
    queryKey: ["saved-job-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("saved_jobs").select("job_id").eq("user_id", user!.id);
      return new Set(data?.map((s) => s.job_id) ?? []);
    },
    enabled: !!user,
  });

  // Fetch user's uploaded resumes
  const { data: userDocuments } = useQuery({
    queryKey: ["seeker-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seeker_documents")
        .select("*")
        .eq("user_id", user!.id)
        .eq("file_type", "resume")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && showApplyForm,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("শুধুমাত্র PDF বা DOC/DOCX ফাইল আপলোড করুন");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ৫MB এর বেশি হতে পারবে না");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(filePath);

      const { data: doc, error: dbError } = await supabase
        .from("seeker_documents")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: "resume",
          file_url: urlData.publicUrl,
        })
        .select()
        .single();
      if (dbError) throw dbError;

      setSelectedDocId(doc.id);
      queryClient.invalidateQueries({ queryKey: ["seeker-documents", user.id] });
      toast.success("সিভি আপলোড সফল হয়েছে!");
    } catch (err: any) {
      toast.error(err.message || "আপলোড ব্যর্থ হয়েছে");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApply = async () => {
    if (!user) {
      toast.error("আবেদন করতে লগইন করুন");
      navigate("/login");
      return;
    }

    setApplying(true);
    try {
      const selectedDoc = userDocuments?.find(d => d.id === selectedDocId);
      const resumeInfo = selectedDoc ? `\n\n[সংযুক্ত সিভি: ${selectedDoc.file_name}]\n${selectedDoc.file_url}` : "";

      const { error } = await supabase.from("applications").insert({
        job_id: id!,
        user_id: user.id,
        cover_letter: (coverLetter.trim() + resumeInfo) || null,
      });

      if (error) {
        if (error.code === "23505") toast.info("আপনি ইতোমধ্যে এই চাকরিতে আবেদন করেছেন");
        else toast.error(error.message);
      } else {
        toast.success("আবেদন সফলভাবে জমা হয়েছে!");
        setShowApplyForm(false);
        queryClient.invalidateQueries({ queryKey: ["application-check", id, user.id] });

        const company = job?.companies as any;
        if (company?.user_id) {
          supabase.functions.invoke("notify", {
            body: {
              type: "new_application",
              resource_id: id,
              user_id: company.user_id,
              title: "📩 নতুন আবেদন!",
              message: `কেউ "${job?.title}" পদে আবেদন করেছে।`,
            },
          }).catch(console.error);
        }
      }
    } finally {
      setApplying(false);
    }
  };

  const company = job?.companies as any;
  const category = job?.categories as any;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-10">
          <div className="h-8 w-48 animate-pulse rounded bg-muted mb-6" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <Briefcase className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-30" />
          <h1 className="text-2xl font-bold font-bangla">চাকরির বিজ্ঞপ্তি পাওয়া যায়নি</h1>
          <p className="mt-2 text-muted-foreground">এই বিজ্ঞপ্তিটি মুছে ফেলা হয়েছে বা নিষ্ক্রিয় করা হয়েছে</p>
          <Button onClick={() => navigate("/jobs")} variant="outline" className="mt-6 gap-2">
            <ArrowLeft className="h-4 w-4" /> সকল চাকরি দেখুন
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <Button onClick={() => navigate("/jobs")} variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> সকল চাকরি
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    {company?.logo_url ? (
                      <img src={company.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain" />
                    ) : (
                      <Building2 className="h-7 w-7 text-primary" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold md:text-2xl">{job.title}</h1>
                    <Link to={`/company/${job.company_id}`} className="mt-1 inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                      <Building2 className="h-4 w-4" />
                      {company?.name}
                      {company?.is_verified && <VerifiedBadge className="h-4 w-4" />}
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <SaveJobButton jobId={job.id} saved={savedJobIds?.has(job.id)} />
                  <ShareJobButton jobTitle={job.title} jobId={job.id} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {job.location}
                </Badge>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> {job.job_type}
                </Badge>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                  <Banknote className="h-3.5 w-3.5" /> {formatSalary(job.salary_min, job.salary_max)}
                </Badge>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5" /> {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </Badge>
                {job.tag && (
                  <Badge className={`px-3 py-1.5 ${job.tag === "Urgent" ? "bg-accent/15 text-accent border-accent/20" : "bg-success/15 text-success border-success/20"}`}>
                    {job.tag}
                  </Badge>
                )}
                {category?.name && (
                  <Badge variant="outline" className="px-3 py-1.5">{category.name}</Badge>
                )}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                প্রকাশিত: {format(new Date(job.created_at), "dd MMM yyyy")}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <h2 className="text-lg font-bold font-bangla mb-4">বিস্তারিত বিবরণ</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {job.requirements && job.requirements.length > 0 && (
              <div className="rounded-2xl border bg-card p-6 shadow-card">
                <h2 className="text-lg font-bold font-bangla mb-4">যোগ্যতা ও অভিজ্ঞতা</h2>
                <ul className="space-y-2.5">
                  {job.requirements.map((req: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <JobFraudWarning />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-card sticky top-20">
              {existingApplication ? (
                <div className="text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-primary mb-3" />
                  <h3 className="font-bold font-bangla text-lg">আবেদন সম্পন্ন</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    আবেদনের তারিখ: {format(new Date(existingApplication.created_at), "dd MMM yyyy")}
                  </p>
                  <Badge variant="secondary" className="mt-3 capitalize">{existingApplication.status}</Badge>
                </div>
              ) : (
                <>
                  <h3 className="font-bold font-bangla text-lg mb-2">এখনই আবেদন করুন</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    এই পদে আবেদন করতে নিচের বাটনে ক্লিক করুন
                  </p>

                  {showApplyForm ? (
                    <div className="space-y-4">
                      {/* CV Selection */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">সিভি নির্বাচন করুন</label>
                        
                        {userDocuments && userDocuments.length > 0 ? (
                          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                            {userDocuments.map((doc) => (
                              <label
                                key={doc.id}
                                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                                  selectedDocId === doc.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground/30"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="cv-select"
                                  checked={selectedDocId === doc.id}
                                  onChange={() => setSelectedDocId(doc.id)}
                                  className="accent-primary"
                                />
                                <File className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(doc.created_at), "dd MMM yyyy")}
                                  </p>
                                </div>
                                {selectedDocId === doc.id && (
                                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                )}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mb-2">কোনো সিভি আপলোড করা হয়নি</p>
                        )}

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full gap-2 rounded-xl"
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {uploading ? "আপলোড হচ্ছে..." : "নতুন সিভি আপলোড করুন"}
                        </Button>
                      </div>

                      {/* Cover letter */}
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">কভার লেটার (ঐচ্ছিক)</label>
                        <Textarea
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder="আপনার আবেদনের সাথে একটি কভার লেটার যোগ করুন..."
                          rows={4}
                          className="resize-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleApply}
                          disabled={applying}
                          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl"
                        >
                          {applying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                          {applying ? "জমা হচ্ছে..." : "আবেদন জমা দিন"}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowApplyForm(false); setSelectedDocId(null); }} className="rounded-xl">
                          বাতিল
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        if (!user) { toast.error("আবেদন করতে লগইন করুন"); navigate("/login"); return; }
                        setShowApplyForm(true);
                      }}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl py-3 text-base"
                    >
                      আবেদন করুন
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <h3 className="font-bold font-bangla text-lg mb-4">প্রতিষ্ঠানের তথ্য</h3>
              <Link to={`/company/${job.company_id}`} className="flex items-center gap-3 mb-4 group">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  {company?.logo_url ? (
                    <img src={company.logo_url} alt="" className="h-8 w-8 rounded-lg object-contain" />
                  ) : (
                    <Building2 className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold group-hover:text-primary transition-colors">{company?.name}</p>
                  {company?.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {company.location}
                    </p>
                  )}
                </div>
              </Link>
              {company?.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{company.description}</p>
              )}
              <div className="space-y-2">
                {company?.phone && (
                  <a href={`tel:${company.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-4 w-4" /> {company.phone}
                  </a>
                )}
                {company?.website && (
                  <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Globe className="h-4 w-4" /> ওয়েবসাইট দেখুন
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default JobDetail;
