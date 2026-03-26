import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AffiliateProduct = {
  id: string; title: string; description: string | null; image_url: string | null;
  affiliate_link: string; category: string; placement: string;
  price: number; discount_price: number | null; sort_order: number;
};

// Sidebar/In-Content Ad Component
export const AffiliateSidebarAd = ({ placement = "sidebar" }: { placement?: "sidebar" | "in_content" }) => {
  const { data: products } = useQuery({
    queryKey: ["affiliate-products", placement],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_products")
        .select("*")
        .eq("is_active", true)
        .in("placement", placement === "sidebar" ? ["sidebar"] : ["in_content"])
        .order("sort_order", { ascending: true })
        .limit(5);
      return (data as unknown as AffiliateProduct[]) ?? [];
    },
  });

  if (!products || products.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        ✨ স্পন্সর্ড
      </h3>
      <div className="space-y-3">
        {products.map(p => (
          <a
            key={p.id}
            href={p.affiliate_link}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all overflow-hidden group"
          >
            {p.image_url && (
              <div className="aspect-[16/9] overflow-hidden">
                <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <div className="p-3">
              <p className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{p.title}</p>
              {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
              <div className="mt-2 flex items-center justify-between">
                {(p.price > 0 || p.discount_price) ? (
                  <div className="flex items-center gap-1.5">
                    {p.discount_price ? (
                      <>
                        <span className="text-xs line-through text-muted-foreground">৳{p.price}</span>
                        <span className="text-sm font-bold text-success">৳{p.discount_price}</span>
                        <Badge className="bg-destructive/10 text-destructive text-[10px] px-1">
                          -{Math.round((1 - p.discount_price / p.price) * 100)}%
                        </Badge>
                      </>
                    ) : (
                      <span className="text-sm font-bold">৳{p.price}</span>
                    )}
                  </div>
                ) : <span />}
                <span className="text-xs text-primary flex items-center gap-0.5">
                  দেখুন <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center">বিজ্ঞাপন</p>
    </div>
  );
};

// Mobile In-Content Ad (insert between list items)
export const AffiliateInContentAd = () => {
  const { data: products } = useQuery({
    queryKey: ["affiliate-in-content"],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_products")
        .select("*")
        .eq("is_active", true)
        .in("placement", ["in_content", "sidebar"])
        .order("sort_order", { ascending: true })
        .limit(1);
      return (data as unknown as AffiliateProduct[]) ?? [];
    },
  });

  const p = products?.[0];
  if (!p) return null;

  return (
    <a
      href={p.affiliate_link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block lg:hidden rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4 transition-all hover:border-primary/40"
    >
      <div className="flex items-center gap-3">
        {p.image_url && (
          <img src={p.image_url} alt={p.title} className="h-16 w-16 rounded-xl object-cover shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <Badge variant="secondary" className="text-[10px] mb-1">স্পন্সর্ড</Badge>
          <p className="font-semibold text-sm line-clamp-1">{p.title}</p>
          <div className="flex items-center gap-2 mt-1">
            {p.discount_price ? (
              <>
                <span className="text-xs line-through text-muted-foreground">৳{p.price}</span>
                <span className="text-sm font-bold text-primary">৳{p.discount_price}</span>
              </>
            ) : p.price && p.price > 0 ? (
              <span className="text-sm font-bold">৳{p.price}</span>
            ) : null}
            <span className="text-xs text-primary flex items-center gap-0.5 ml-auto">
              দেখুন <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
};

// Mobile Carousel (horizontal scroll)
export const AffiliateCarousel = () => {
  const { data: products } = useQuery({
    queryKey: ["affiliate-carousel"],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_products")
        .select("*")
        .eq("is_active", true)
        .in("placement", ["carousel", "sidebar"])
        .order("sort_order", { ascending: true })
        .limit(10);
      return (data as unknown as AffiliateProduct[]) ?? [];
    },
  });

  if (!products || products.length === 0) return null;

  return (
    <div className="lg:hidden py-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
        ✨ স্পন্সর্ড ডিলস
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {products.map(p => (
          <a
            key={p.id}
            href={p.affiliate_link}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="snap-start shrink-0 w-48 rounded-xl border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            {p.image_url && (
              <img src={p.image_url} alt={p.title} className="h-28 w-full object-cover" />
            )}
            <div className="p-2.5">
              <p className="font-semibold text-xs line-clamp-2">{p.title}</p>
              <div className="mt-1.5 flex items-center gap-1">
                {p.discount_price ? (
                  <>
                    <span className="text-[10px] line-through text-muted-foreground">৳{p.price}</span>
                    <span className="text-xs font-bold text-primary">৳{p.discount_price}</span>
                  </>
                ) : p.price && p.price > 0 ? (
                  <span className="text-xs font-bold">৳{p.price}</span>
                ) : null}
              </div>
            </div>
          </a>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center">বিজ্ঞাপন</p>
    </div>
  );
};


// Popup Ad Component
export const AffiliatePopup = () => {
  const location = useLocation();
  const hideAds = location.pathname === "/login" || location.pathname === "/signup" || location.pathname.startsWith("/dashboard");
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<AffiliateProduct | null>(null);

  const { data: products } = useQuery({
    queryKey: ["affiliate-popup-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_products")
        .select("*")
        .eq("is_active", true)
        .eq("placement", "popup")
        .order("sort_order", { ascending: true })
        .limit(10);
      return (data as unknown as AffiliateProduct[]) ?? [];
    },
  });

  useEffect(() => {
    if (!products || products.length === 0) return;
    const lastShown = sessionStorage.getItem("affiliate-popup-last");
    const now = Date.now();
    // Show after 30s, max once per session per 10 minutes
    if (lastShown && now - parseInt(lastShown) < 10 * 60 * 1000) return;

    const timer = setTimeout(() => {
      const random = products[Math.floor(Math.random() * products.length)];
      setCurrent(random);
      setVisible(true);
      sessionStorage.setItem("affiliate-popup-last", now.toString());
    }, 30000);

    return () => clearTimeout(timer);
  }, [products]);

  // Auto-close after 8s
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible || !current || hideAds) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] animate-in slide-in-from-right-full duration-500">
      <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-start gap-1 p-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-auto shrink-0" onClick={() => setVisible(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <a href={current.affiliate_link} target="_blank" rel="noopener noreferrer sponsored" className="block group">
          {current.image_url && (
            <div className="px-3">
              <img src={current.image_url} alt={current.title} className="w-full h-36 object-cover rounded-xl" />
            </div>
          )}
          <div className="p-3">
            <Badge variant="secondary" className="text-[10px] mb-1.5">স্পন্সর্ড</Badge>
            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{current.title}</p>
            {current.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{current.description}</p>}
            <div className="mt-2 flex items-center justify-between">
              {current.discount_price ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs line-through text-muted-foreground">৳{current.price}</span>
                  <span className="text-sm font-bold text-success">৳{current.discount_price}</span>
                </div>
              ) : current.price > 0 ? (
                <span className="text-sm font-bold">৳{current.price}</span>
              ) : <span />}
              <span className="text-xs text-primary flex items-center gap-1 font-medium">
                এখনই দেখুন <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};
