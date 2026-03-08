import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Header from "@/components/Header";
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

  // Fetch or create company for current user
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

  const createCompany = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("companies")
      .insert({ user_id: user.id, name: companyForm.name, location: companyForm.location, description: companyForm.description })
      .select()
      .single();
    if (error) { toast.error(error.message); return null; }
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
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Job posted successfully!");
      navigate("/");
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-2xl py-10">
        <h1 className="text-2xl font-bold md:text-3xl">Post a Job</h1>
        <p className="mt-1 text-muted-foreground">Fill in the details to publish your job listing</p>

        {!company && !showCompanyForm && (
          <div className="mt-6 rounded-xl border bg-secondary/50 p-6">
            <h3 className="font-semibold">First, create your company profile</h3>
            <p className="text-sm text-muted-foreground">You need a company profile to post jobs.</p>
            <Button onClick={() => setShowCompanyForm(true)} className="mt-3 bg-primary text-primary-foreground">Create Company</Button>
          </div>
        )}

        {showCompanyForm && !company && (
          <div className="mt-6 space-y-4 rounded-xl border p-6">
            <h3 className="font-semibold">Company Details</h3>
            <div>
              <Label>Company Name</Label>
              <Input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} required />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={companyForm.location} onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Job Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Software Engineer" />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required placeholder="e.g. Dhaka" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Min Salary (৳)</Label>
              <Input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} placeholder="40000" />
            </div>
            <div>
              <Label>Max Salary (৳)</Label>
              <Input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} placeholder="80000" />
            </div>
            <div>
              <Label>Job Type</Label>
              <Select value={form.jobType} onValueChange={(v) => setForm({ ...form, jobType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
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
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={5} placeholder="Describe the role and responsibilities..." />
          </div>
          <div>
            <Label>Requirements (one per line)</Label>
            <Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={4} placeholder="Bachelor's degree in CS&#10;3+ years experience&#10;..." />
          </div>
          <Button type="submit" disabled={loading || (!company && !showCompanyForm)} className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 font-semibold">
            {loading ? "Posting..." : "Post Job"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
