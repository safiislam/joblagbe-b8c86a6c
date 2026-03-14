import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertTriangle, Upload, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

const PostJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    jobType: "Full-time",
    categoryId: "",
    description: "",
    requirements: "",
    tag: "",
  });

  const { data: company } = useQuery({
    queryKey: ["my-company", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("companies").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

  const [companyForm, setCompanyForm] = useState({ name: "", location: "", description: "" });
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (companyId: string): Promise<string | null> => {
    if (!logoFile) return null;
    const ext = logoFile.name.split(".").pop();
    const path = `${companyId}/logo.${ext}`;
    const { error } = await supabase.storage.from("company-logos").upload(path, logoFile, { upsert: true });
    if (error) { console.error(error); return null; }
    return path;
  };

  const createCompany = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("companies")
      .insert({ user_id: user.id, name: companyForm.name, location: companyForm.location, description: companyForm.description })
      .select()
      .single();
    if (error) { toast.error(error.message); return null; }

    // Upload logo if selected
    if (logoFile && data) {
      const logoPath = await uploadLogo(data.id);
      if (logoPath) {
        const publicUrl = supabase.storage.from("company-logos").getPublicUrl(logoPath).data.publicUrl;
        await supabase.from("companies").update({ logo_url: publicUrl }).eq("id", data.id);
      }
    }

    toast.success("Company created!");
    setShowCompanyForm(false);
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please login first"); navigate("/login"); return; }

    setLoading(true);
    let companyId = company?.id;

    if (!companyId) {
      const newCompany = await createCompany();
      if (!newCompany) { setLoading(false); return; }
      companyId = newCompany.id;
    }

    const { error } = await supabase.from("jobs").insert({
      company_id: companyId,
      category_id: form.categoryId || null,
      title: form.title,
      location: form.location,
      salary_min: form.salaryMin ? parseInt(form.salaryMin) : null,
      salary_max: form.salaryMax ? parseInt(form.salaryMax) : null,
      job_type: form.jobType,
      tag: form.tag || null,
      description: form.description,
      requirements: form.requirements.split("\n").filter(Boolean),
      is_approved: false,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSubmitted(true);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-bold">Login Required</h2>
          <p className="mt-2 text-muted-foreground">You need to be logged in as an employer to post jobs.</p>
          <Button onClick={() => navigate("/login")} className="mt-4 bg-accent text-accent-foreground">Login</Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 mb-4">
            <Clock className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold">Job Submitted for Review!</h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Your job posting has been submitted and is pending admin approval. 
            You'll be notified once it's live on the platform.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => navigate("/employer-dashboard")} variant="outline">Go to Dashboard</Button>
            <Button onClick={() => { setSubmitted(false); setForm({ title: "", location: "", salaryMin: "", salaryMax: "", jobType: "Full-time", categoryId: "", description: "", requirements: "", tag: "" }); }} className="bg-accent text-accent-foreground">
              Post Another Job
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-2xl py-8">
        <h1 className="text-2xl font-bold md:text-3xl">Post a Job</h1>
        <p className="mt-1 text-muted-foreground">Fill in the details to publish your job listing</p>

        <Alert className="mt-4 border-accent/30 bg-accent/5">
          <AlertTriangle className="h-4 w-4 text-accent" />
          <AlertDescription className="text-sm">
            All job postings are reviewed by our admin team before going live. This helps maintain quality and protect job seekers.
          </AlertDescription>
        </Alert>

        {!company && !showCompanyForm && (
          <div className="mt-6 rounded-2xl border bg-secondary/50 p-6">
            <h3 className="font-semibold">First, create your company profile</h3>
            <p className="text-sm text-muted-foreground">You need a company profile to post jobs.</p>
            <Button onClick={() => setShowCompanyForm(true)} className="mt-3 bg-primary text-primary-foreground rounded-xl">Create Company</Button>
          </div>
        )}

        {showCompanyForm && !company && (
          <div className="mt-6 space-y-4 rounded-2xl border p-6">
            <h3 className="font-semibold">Company Details</h3>
            <div>
              <Label>Company Logo</Label>
              <div className="mt-1.5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-secondary overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => logoInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" /> {logoFile ? "Change Logo" : "Upload Logo"}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                </div>
              </div>
            </div>
            <div>
              <Label>Company Name</Label>
              <Input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} required className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={companyForm.location} onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} className="mt-1.5 rounded-xl" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Job Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Software Engineer" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required placeholder="e.g. Dhaka" className="mt-1.5 rounded-xl" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Min Salary (৳)</Label>
              <Input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} placeholder="40000" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Max Salary (৳)</Label>
              <Input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} placeholder="80000" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Job Type</Label>
              <Select value={form.jobType} onValueChange={(v) => setForm({ ...form, jobType: v })}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Full-time", "Part-time", "Contract", "Remote", "Internship"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tag (optional)</Label>
              <Select value={form.tag} onValueChange={(v) => setForm({ ...form, tag: v })}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={5} placeholder="Describe the role and responsibilities..." className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Requirements (one per line)</Label>
            <Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={4} placeholder="Bachelor's degree in CS&#10;3+ years experience&#10;..." className="mt-1.5 rounded-xl" />
          </div>
          <Button type="submit" disabled={loading || (!company && !showCompanyForm)} className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 font-semibold rounded-xl">
            {loading ? "Submitting..." : "Submit for Review"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
