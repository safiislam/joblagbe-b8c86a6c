import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Props = { jobId: string; saved?: boolean; onToggle?: () => void; size?: "sm" | "icon" };

const SaveJobButton = ({ jobId, saved = false, onToggle, size = "icon" }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(saved);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!user) { toast.error("Please login first"); navigate("/login"); return; }
    setLoading(true);
    if (isSaved) {
      await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);
      setIsSaved(false);
      toast.success("Removed from saved");
    } else {
      const { error } = await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: jobId });
      if (error?.code === "23505") { setIsSaved(true); }
      else if (error) toast.error(error.message);
      else { setIsSaved(true); toast.success("Job saved!"); }
    }
    setLoading(false);
    onToggle?.();
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      disabled={loading}
      className={`shrink-0 ${isSaved ? "text-accent" : "text-muted-foreground hover:text-accent"}`}
      title={isSaved ? "Remove bookmark" : "Save job"}
    >
      <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
    </Button>
  );
};

export default SaveJobButton;
