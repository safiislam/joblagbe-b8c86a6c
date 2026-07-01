import { useState, useRef, useMemo } from "react";
import { format, addDays, addMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import MultiLocationInput from "@/components/MultiLocationInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CalendarIcon, ImagePlus, X, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

export interface CircularJobPayload {
  companyId: string;
  title: string;
  categoryId: string;
  sourceUrl: string;
  locations: string[];
  deadline?: Date;
  jobType: string;
  description: string;
  salaryMin: string;
  salaryMax: string;
  imageUrl: string;
}

interface CircularPostFormProps {
  companyId: string;
  onSuccess: () => void;
  isFree: boolean;
  effectivePrice: number;
  onPaymentRequired: (data: { companyId: string; payload: CircularJobPayload }) => void;
}

const CircularPostForm = ({ companyId, onSuccess, isFree, effectivePrice, onPaymentRequired }: CircularPostFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [jobType, setJobType] = useState<string>("Full-time");
  const [description, setDescription] = useState("");
  const [salaryMin, setSalaryMin] = useState<string>("");
  const [salaryMax, setSalaryMax] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const minDeadline = useMemo(() => addDays(new Date(), 1), []);
  const maxDeadline = useMemo(() => addMonths(new Date(), 1), []);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

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

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    const ext = imageFile.name.split(".").pop();
    const path = `${companyId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("circular-images").upload(path, imageFile);
    if (error) {
      toast.error("ছবি আপলোড ব্যর্থ হয়েছে");
      return null;
    }
    return supabase.storage.from("circular-images").getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error("সার্কুলার ছবি আপলোড করুন");
      return;
    }
    if (!title.trim()) {
      toast.error("টাইটেল লিখুন");
      return;
    }

    setSubmitting(true);

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .gte("created_at", today.toISOString());

    if ((count ?? 0) >= 10) {
      toast.error("আপনি আজকের জন্য সর্বোচ্চ ১০টি চাকরি পোস্ট করেছেন।");
      setSubmitting(false);
      return;
    }

    const imageUrl = await uploadImage();
    if (!imageUrl) {
      setSubmitting(false);
      return;
    }

    if (!isFree) {
      onPaymentRequired({
        companyId,
        payload: {
          companyId,
          title: title.trim(),
          categoryId: categoryId || "",
          sourceUrl: sourceUrl.trim(),
          locations,
          deadline,
          jobType,
          description: description.trim(),
          salaryMin,
          salaryMax,
          imageUrl,
        },
      });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("jobs").insert({
      company_id: companyId,
      title: title.trim(),
      location: locations.length > 0 ? locations.join(", ") : "বাংলাদেশ",
      description: description.trim() || `সার্কুলার বিজ্ঞপ্তি: ${title.trim()} — বিস্তারিত তথ্যের জন্য ছবি দেখুন।`,
      category_id: categoryId || null,
      application_deadline: deadline ? deadline.toISOString() : null,
      source_url: sourceUrl.trim() || null,
      circular_image_url: imageUrl,
      post_type: "circular",
      job_type: jobType,
      salary_min: salaryMin ? parseInt(salaryMin, 10) : null,
      salary_max: salaryMax ? parseInt(salaryMax, 10) : null,
      is_approved: false,
      hide_apply: true,
    });

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image Upload */}
      <div>
        <Label className="text-base font-semibold">সার্কুলার ছবি <span className="text-destructive">*</span></Label>
        <p className="text-xs text-muted-foreground mb-2">চাকরির বিজ্ঞপ্তির ছবি আপলোড করুন (সর্বোচ্চ 2MB)</p>
        {imagePreview ? (
          <div className="relative rounded-xl border overflow-hidden bg-secondary/30">
            <img src={imagePreview} alt="Circular preview" className="w-full max-h-80 object-contain" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full h-48 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <ImagePlus className="h-10 w-10 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">ক্লিক করে ছবি আপলোড করুন</span>
          </button>
        )}
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      </div>

      {/* Title */}
      <div>
        <Label>টাইটেল <span className="text-destructive">*</span></Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="যেমন: বাংলাদেশ সেনাবাহিনী নিয়োগ বিজ্ঞপ্তি ২০২৫" className="mt-1.5 rounded-xl" />
      </div>

      {/* Category & Job Type */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>ক্যাটাগরি</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="ক্যাটাগরি নির্বাচন" /></SelectTrigger>
            <SelectContent>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>চাকরির ধরন</Label>
          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Full-time">ফুল-টাইম</SelectItem>
              <SelectItem value="Part-time">পার্ট-টাইম</SelectItem>
              <SelectItem value="Contract">চুক্তিভিত্তিক</SelectItem>
              <SelectItem value="Internship">ইন্টার্নশিপ</SelectItem>
              <SelectItem value="Remote">রিমোট</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Salary & Deadline */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>বেতন রেঞ্জ (ঐচ্ছিক)</Label>
          <div className="mt-1.5 flex gap-2">
            <Input type="number" min={0} value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="সর্বনিম্ন" className="rounded-xl" />
            <Input type="number" min={0} value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="সর্বোচ্চ" className="rounded-xl" />
          </div>
        </div>
        <div>
          <Label>আবেদনের শেষ তারিখ</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full mt-1.5 justify-start text-left font-normal rounded-xl", !deadline && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadline ? format(deadline, "dd MMM yyyy") : "ডেডলাইন নির্বাচন করুন"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={deadline}
                onSelect={setDeadline}
                disabled={(date) => date < minDeadline || date > maxDeadline}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <p className="mt-1 text-xs text-muted-foreground">সর্বোচ্চ ১ মাস</p>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label>বিবরণ (ঐচ্ছিক)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="চাকরি সম্পর্কিত সংক্ষিপ্ত বিবরণ লিখুন (পদ, যোগ্যতা, আবেদনের নিয়ম ইত্যাদি)"
          rows={4}
          className="mt-1.5 rounded-xl"
        />
        <p className="mt-1 text-xs text-muted-foreground">খালি রাখলে শুধু ছবি দেখানো হবে</p>
      </div>

      {/* Source Link */}
      <div>
        <Label>সোর্স লিংক (ঐচ্ছিক)</Label>
        <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="যেমন: https://army.mil.bd/circular" className="mt-1.5 rounded-xl" />
        <p className="mt-1 text-xs text-muted-foreground">মূল বিজ্ঞপ্তির লিংক যোগ করুন</p>
      </div>

      {/* Location */}
      <div>
        <Label>লোকেশন (ঐচ্ছিক)</Label>
        <div className="mt-1.5">
          <MultiLocationInput locations={locations} onChange={setLocations} placeholder="যেমন: ঢাকা" />
        </div>
      </div>

      <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 font-semibold rounded-xl">
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> জমা হচ্ছে...</> : isFree ? "জমা দিন (রিভিউয়ের জন্য)" : `৳${effectivePrice} পে করুন ও জমা দিন`}
      </Button>
    </form>
  );
};

export default CircularPostForm;
