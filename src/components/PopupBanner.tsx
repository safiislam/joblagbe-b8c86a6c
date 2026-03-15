import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type PopupBanner = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  sort_order: number;
};

const DISMISSED_KEY = "popup_banner_dismissed";

const PopupBannerModal = () => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const { data: banners } = useQuery({
    queryKey: ["popup-banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("popup_banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      return (data ?? []) as PopupBanner[];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!banners?.length) return;
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [banners]);

  const close = useCallback(() => {
    setOpen(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  }, []);

  if (!open || !banners?.length) return null;

  const banner = banners[current];
  const total = banners.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={close}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl bg-card shadow-elevated overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 rounded-full bg-background/80 backdrop-blur p-1.5 shadow-md hover:bg-background transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image */}
        {banner.image_url && (
          <div className="relative w-full aspect-[16/10] bg-muted overflow-hidden">
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
            {/* Carousel navigation arrows over image */}
            {total > 1 && (
              <>
                <button
                  onClick={() => setCurrent((c) => (c - 1 + total) % total)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur p-1.5 shadow hover:bg-background transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrent((c) => (c + 1) % total)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur p-1.5 shadow hover:bg-background transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5 text-center space-y-3">
          <h3 className="text-lg font-bold font-bangla">{banner.title}</h3>
          {banner.description && (
            <p className="text-sm text-muted-foreground font-bangla">{banner.description}</p>
          )}

          {/* Dots */}
          {total > 1 && (
            <div className="flex justify-center gap-1.5 pt-1">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === current ? "bg-primary w-4" : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* CTA */}
          {banner.cta_link && (
            <Button asChild className="w-full mt-2">
              <a href={banner.cta_link} target="_blank" rel="noopener noreferrer" className="gap-2">
                {banner.cta_text || "বিস্তারিত দেখুন"}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopupBannerModal;
