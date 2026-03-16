import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { checkRateLimit, RATE_LIMITS } from "@/hooks/useRateLimit";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileText, Upload, Loader2, File, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ApplyJobDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  companyName?: string;
  companyId?: string;
  onSuccess?: () => void;
};

const ApplyJobDialog = ({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  companyName,
  companyId,
  onSuccess,
}: ApplyJobDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["seeker-documents", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("seeker_documents")
        .select("*")
        .eq("user_id", user!.id)
        .eq("file_type", "resume")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user && open,
  });

  const { data: existingApp } = useQuery({
    queryKey: ["existing-application", jobId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && open,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("শুধুমাত্র PDF বা DOC ফাইল আপলোড করুন");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ৫MB এর বেশি হতে পারবে না");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(filePath);

      const { data: doc, error: insertError } = await supabase
        .from("seeker_documents")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: "resume",
          file_url: urlData.publicUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setSelectedDocId(doc.id);
      queryClient.invalidateQueries({ queryKey: ["seeker-documents", user.id] });
      toast.success("সিভি আপলোড হয়েছে!");
    } catch (err: any) {
      toast.error(err.message || "আপলোড ব্যর্থ হয়েছে");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!selectedDocId) {
      toast.error("অনুগ্রহ করে একটি সিভি নির্বাচন করুন");
      return;
    }

    setApplying(true);
    try {
      const { error } = await supabase.from("applications").insert({
        job_id: jobId,
        user_id: user.id,
        cover_letter: coverLetter.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("আপনি ইতোমধ্যে এই চাকরিতে আবেদন করেছেন");
        } else {
          throw error;
        }
      } else {
        toast.success("আবেদন সফলভাবে জমা হয়েছে! 🎉");

        // Notify employer
        if (companyId) {
          const { data: comp } = await supabase
            .from("companies")
            .select("user_id")
            .eq("id", companyId)
            .maybeSingle();
          if (comp?.user_id) {
            supabase.functions
              .invoke("notify", {
                body: {
                  type: "new_application",
                  resource_id: jobId,
                  user_id: comp.user_id,
                  title: "📩 নতুন আবেদন!",
                  message: `কেউ আপনার "${jobTitle}" চাকরিতে আবেদন করেছে।`,
                },
              })
              .catch(console.error);
          }
        }

        onSuccess?.();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.message || "আবেদন জমা দিতে সমস্যা হয়েছে");
    } finally {
      setApplying(false);
    }
  };

  if (existingApp) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="mt-4 text-lg font-bold">ইতোমধ্যে আবেদন করেছেন</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              আপনি এই চাকরিতে আগেই আবেদন করেছেন। আপনার আবেদনের স্ট্যাটাস ড্যাশবোর্ড থেকে দেখতে পারবেন।
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline" className="mt-4 rounded-xl">
              ঠিক আছে
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">আবেদন করুন</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{jobTitle}</span>
            {companyName && <span className="text-muted-foreground"> — {companyName}</span>}
          </DialogDescription>
        </DialogHeader>

        {/* CV Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            সিভি নির্বাচন করুন <span className="text-destructive">*</span>
          </label>

          {docsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {documents && documents.length > 0 ? (
                documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      selectedDocId === doc.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "hover:border-primary/30 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      selectedDocId === doc.id ? "bg-primary/10" : "bg-muted"
                    )}>
                      <File className={cn("h-5 w-5", selectedDocId === doc.id ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("bn-BD")}
                      </p>
                    </div>
                    {selectedDocId === doc.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    কোনো সিভি আপলোড করা হয়নি
                  </p>
                  <p className="text-xs text-muted-foreground">নিচে থেকে নতুন সিভি আপলোড করুন</p>
                </div>
              )}

              {/* Upload new CV */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl gap-2 border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "আপলোড হচ্ছে..." : "নতুন সিভি আপলোড করুন"}
              </Button>
            </div>
          )}
        </div>

        {/* Cover Letter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">কভার লেটার (ঐচ্ছিক)</label>
          <Textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="কেন আপনি এই চাকরির জন্য উপযুক্ত তা সংক্ষেপে লিখুন..."
            rows={3}
            className="rounded-xl resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            বাতিল
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={applying || !selectedDocId}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl gap-2 font-semibold"
          >
            {applying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                আবেদন জমা দিন <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyJobDialog;
