import { useState, useMemo, useRef } from "react";
import { format, addDays, addMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import MultiLocationInput from "@/components/MultiLocationInput";

interface EditJobDialogProps {
  job: {
    id: string;
    title: string;
    location: string;
    job_type: string;
    description: string;
    requirements: string[] | null;
    salary_min: number | null;
    salary_max: number | null;
    category_id: string | null;
    application_deadline: string | null;
    source_url?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditJobDialog = ({ job, open, onOpenChange, onSuccess }: EditJobDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ছবি সর্বোচ্চ 2MB হতে হবে");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // const uploadImage = async (): Promise<string | null> => {
  //   if (!imageFile) return null;
  //   const ext = imageFile.name.split(".").pop();
  //   const path = `${companyId}/${Date.now()}.${ext}`;
  //   const { error } = await supabase.storage.from("circular-images").upload(path, imageFile);
  //   if (error) {
  //     toast.error("ছবি আপলোড ব্যর্থ হয়েছে");
  //     return null;
  //   }
  //   return supabase.storage.from("circular-images").getPublicUrl(path).data.publicUrl;
  // };

  const [form, setForm] = useState({
    title: job.title,
    salaryMin: job.salary_min?.toString() ?? "",
    salaryMax: job.salary_max?.toString() ?? "",
    jobType: job.job_type,
    categoryId: job.category_id ?? "",
    description: job.description,
    requirements: job.requirements?.join("\n") ?? "",
    sourceUrl: job.source_url ?? "",
  });
  const [locations, setLocations] = useState<string[]>(
    job.location ? job.location.split(", ").filter(Boolean) : []
  );
  const [deadline, setDeadline] = useState<Date | undefined>(
    job.application_deadline ? new Date(job.application_deadline) : undefined
  );

  const minDeadline = useMemo(() => addDays(new Date(), 1), []);
  const maxDeadline = useMemo(() => addMonths(new Date(), 1), []);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locations.length === 0) {
      toast.error("অন্তত একটি লোকেশন যোগ করুন");
      return;
    }
    setLoading(true);

    const { error } = await supabase
      .from("jobs")
      .update({
        title: form.title,
        location: locations.join(", "),
        salary_min: form.salaryMin ? parseInt(form.salaryMin) : null,
        salary_max: form.salaryMax ? parseInt(form.salaryMax) : null,
        job_type: form.jobType,
        category_id: form.categoryId || null,
        description: form.description,
        requirements: form.requirements.split("\n").filter(Boolean),
        application_deadline: deadline ? deadline.toISOString() : null,
        is_approved: false,
        source_url: form.sourceUrl.trim() || null,
      } as any)
      .eq("id", job.id);

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("চাকরি আপডেট হয়েছে এবং পুনরায় অনুমোদনের জন্য জমা দেওয়া হয়েছে!");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>চাকরি সম্পাদনা করুন</DialogTitle>
        </DialogHeader>

        <Alert className="border-accent/30 bg-accent/5">
          <AlertTriangle className="h-4 w-4 text-accent" />
          <AlertDescription className="text-sm">
            সম্পাদনার পর চাকরিটি পুনরায় অ্যাডমিন অনুমোদনের জন্য জমা হবে।
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Job Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Location(s)</Label>
              <div className="mt-1.5">
                <MultiLocationInput locations={locations} onChange={setLocations} />
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Min Salary (৳)</Label>
              <Input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Max Salary (৳)</Label>
              <Input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} className="mt-1.5 rounded-xl" />
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
              <Label>Application Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full mt-1.5 justify-start text-left font-normal rounded-xl", !deadline && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "dd MMM yyyy") : "ডেডলাইন নির্বাচন করুন"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} disabled={(date) => date < minDeadline || date > maxDeadline} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={5} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Requirements (one per line)</Label>
            <Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={4} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Source Link (ঐচ্ছিক)</Label>
            <Input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="e.g. https://original-job-post.com/apply" className="mt-1.5 rounded-xl" />
            <p className="mt-1 text-xs text-muted-foreground">মূল চাকরির বিজ্ঞপ্তির লিংক যোগ করুন</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>বাতিল</Button>
            <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "আপডেট ও পুনরায় জমা দিন"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditJobDialog;
