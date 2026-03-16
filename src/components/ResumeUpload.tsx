import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, Loader2, Video, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type DocumentRow = {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  created_at: string;
};

const ResumeUpload = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"resume" | "video_cv">("resume");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["seeker-documents", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("seeker_documents")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data as DocumentRow[]) ?? [];
    },
    enabled: !!user,
  });

  const resumes = documents?.filter((d) => d.file_type === "resume") ?? [];
  const videoCvs = documents?.filter((d) => d.file_type === "video_cv") ?? [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "resume" | "video_cv") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = type === "video_cv" ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxLabel = type === "video_cv" ? "50MB" : "5MB";

    if (file.size > maxSize) {
      toast.error(`File size must be under ${maxLabel}`);
      return;
    }

    const bucket = type === "video_cv" ? "video-cvs" : "resumes";
    const ext = file.name.split(".").pop();
    const timestamp = Date.now();
    const filePath = `${user.id}/${timestamp}.${ext}`;

    setUploading(true);
    setUploadType(type);

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: false });
    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("seeker_documents").insert({
      user_id: user.id,
      file_url: filePath,
      file_name: file.name,
      file_type: type,
    });

    if (dbError) {
      toast.error(dbError.message);
    } else {
      toast.success(type === "video_cv" ? "Video CV uploaded!" : "Resume uploaded!");
      queryClient.invalidateQueries({ queryKey: ["seeker-documents", user.id] });
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (doc: DocumentRow) => {
    if (!user) return;
    const bucket = doc.file_type === "video_cv" ? "video-cvs" : "resumes";
    await supabase.storage.from(bucket).remove([doc.file_url]);
    await supabase.from("seeker_documents").delete().eq("id", doc.id);
    queryClient.invalidateQueries({ queryKey: ["seeker-documents", user.id] });
    toast.success("File removed");
  };

  const getPublicUrl = (doc: DocumentRow) => {
    const bucket = doc.file_type === "video_cv" ? "video-cvs" : "resumes";
    return supabase.storage.from(bucket).getPublicUrl(doc.file_url).data.publicUrl;
  };

  return (
    <div className="space-y-4">
      {/* Resumes Section */}
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h3 className="font-bold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Resume / CV
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">Upload up to 2 resumes (PDF, DOC — max 5MB each)</p>

        {isLoading ? (
          <div className="mt-3 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="mt-3 space-y-2">
            {resumes.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2">
                <a
                  href={getPublicUrl(doc)}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-2 text-sm text-primary hover:underline truncate min-w-0"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{doc.file_name}</span>
                </a>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(doc)} className="text-destructive hover:text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {resumes.length < 2 && (
          <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-primary/20 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
            {uploading && uploadType === "resume" ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Plus className="h-5 w-5 text-primary" />
            )}
            <span className="text-sm text-muted-foreground">
              {uploading && uploadType === "resume" ? "Uploading..." : `Add resume (${resumes.length}/2)`}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleUpload(e, "resume")}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
        {resumes.length >= 2 && (
          <p className="mt-3 text-xs text-muted-foreground text-center">সর্বোচ্চ ২টি সিভি আপলোড করা হয়েছে</p>
        )}
      </div>

      {/* Video CV Section */}
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h3 className="font-bold flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" /> Video CV
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">Upload a short video introducing yourself (MP4, MOV — max 50MB)</p>

        {!isLoading && videoCvs.map((doc) => (
          <div key={doc.id} className="mt-3 rounded-xl bg-muted/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <a
                href={getPublicUrl(doc)}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 text-sm text-primary hover:underline truncate min-w-0"
              >
                <Video className="h-4 w-4 shrink-0" />
                <span className="truncate">{doc.file_name}</span>
              </a>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(doc)} className="text-destructive hover:text-destructive shrink-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <video
              src={getPublicUrl(doc)}
              controls
              className="mt-2 w-full rounded-lg max-h-48"
            />
          </div>
        ))}

        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-primary/20 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
          {uploading && uploadType === "video_cv" ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Plus className="h-5 w-5 text-primary" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploading && uploadType === "video_cv" ? "Uploading..." : "Add video CV"}
          </span>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={(e) => handleUpload(e, "video_cv")}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
};

export default ResumeUpload;
