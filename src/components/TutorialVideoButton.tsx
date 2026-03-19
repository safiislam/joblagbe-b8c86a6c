import { useState } from "react";
import { CircleHelp, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type VideoEntry = { page_key: string; page_label: string; video_url: string };

const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  // Facebook video
  if (url.includes("facebook.com")) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=true`;
  // Direct embed
  return url;
};

const pageKeyFromPath = (pathname: string): string => {
  if (pathname === "/") return "home";
  // Remove leading slash, take first segment
  const segments = pathname.replace(/^\//, "").split("/");
  return segments[0] || "home";
};

const TutorialVideoButton = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const currentPageKey = pageKeyFromPath(location.pathname);

  const { data: videos } = useQuery({
    queryKey: ["tutorial-videos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "tutorial_videos")
        .maybeSingle();
      return ((data?.content as any)?.videos || []) as VideoEntry[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const currentVideo = videos?.find((v) => v.page_key === currentPageKey);
  if (!currentVideo?.video_url) return null;

  const embedUrl = getEmbedUrl(currentVideo.video_url);

  return (
    <>
      <div className="fixed bottom-20 left-4 z-40 md:bottom-6 md:left-6">
        <button
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
          aria-label="Tutorial video"
          title="সাহায্য / টিউটোরিয়াল ভিডিও"
        >
          <CircleHelp className="h-5 w-5" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-2">
            <DialogTitle className="text-base flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-primary" />
              {currentVideo.page_label || "টিউটোরিয়াল ভিডিও"}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black">
            {embedUrl && (
              <iframe
                src={embedUrl}
                className="h-full w-full"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
                title="Tutorial Video"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TutorialVideoButton;
