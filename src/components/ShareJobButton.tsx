import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = { jobTitle: string; jobId: string };

const ShareJobButton = ({ jobTitle, jobId }: Props) => {
  const url = `${window.location.origin}/#jobs`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: jobTitle, text: `Check out this job: ${jobTitle}`, url });
    } else {
      await navigator.clipboard.writeText(`${jobTitle} - ${url}`);
      toast.success("Link copied!");
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleShare(); }} className="shrink-0 text-muted-foreground hover:text-primary" title="Share">
      <Share2 className="h-4 w-4" />
    </Button>
  );
};

export default ShareJobButton;
