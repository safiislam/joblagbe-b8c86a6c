import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ResumeUpload = () => {
  const { user, profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(profile?.resume_url ?? null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/resume.${ext}`;

    setUploading(true);
    const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(filePath);
    
    await supabase.from("profiles").update({ resume_url: filePath }).eq("user_id", user.id);
    setResumeUrl(filePath);
    setUploading(false);
    toast.success("Resume uploaded!");
  };

  const handleDelete = async () => {
    if (!user || !resumeUrl) return;
    setUploading(true);
    await supabase.storage.from("resumes").remove([resumeUrl]);
    await supabase.from("profiles").update({ resume_url: null }).eq("user_id", user.id);
    setResumeUrl(null);
    setUploading(false);
    toast.success("Resume removed");
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <h3 className="font-bold flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" /> Resume / CV
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">Upload your resume (PDF, DOC — max 5MB)</p>

      {resumeUrl ? (
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
            <FileText className="h-4 w-4" />
            <span>Resume uploaded ✓</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={uploading} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-primary/20 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-primary" />}
          <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload resume"}</span>
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      )}
    </div>
  );
};

export default ResumeUpload;
