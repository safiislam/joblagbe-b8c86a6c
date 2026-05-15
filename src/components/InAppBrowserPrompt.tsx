import { useEffect, useState } from "react";
import { ExternalLink, X, Copy, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STORAGE_KEY = "__inapp_browser_dismissed_at";
const SUPPRESS_MS = 1000 * 60 * 60 * 12; // 12 hours

const detectInAppBrowser = (): { isInApp: boolean; platform: "ios" | "android" | "other" } => {
  if (typeof navigator === "undefined") return { isInApp: false, platform: "other" };
  const ua = navigator.userAgent || "";
  const platform: "ios" | "android" | "other" = /iPad|iPhone|iPod/.test(ua)
    ? "ios"
    : /Android/i.test(ua)
    ? "android"
    : "other";

  // Common in-app browser UA signatures
  const inAppPatterns = [
    /FBAN|FBAV|FB_IAB|FBIOS/i,        // Facebook
    /Instagram/i,
    /Messenger/i,
    /Line\//i,
    /MicroMessenger/i,                 // WeChat
    /Twitter/i,
    /TikTok|musical_ly|BytedanceWebview/i,
    /Snapchat/i,
    /LinkedInApp/i,
    /Pinterest/i,
  ];
  const isInApp = inAppPatterns.some((re) => re.test(ua));
  return { isInApp, platform };
};

const InAppBrowserPrompt = () => {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    const { isInApp, platform: p } = detectInAppBrowser();
    if (!isInApp) return;
    try {
      const dismissed = Number(localStorage.getItem(STORAGE_KEY) || 0);
      if (Date.now() - dismissed < SUPPRESS_MS) return;
    } catch {}
    setPlatform(p);
    const t = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
    setOpen(false);
  };

  const openExternal = () => {
    const url = window.location.href;
    if (platform === "android") {
      // Chrome intent — opens directly in Chrome on Android
      const cleanUrl = url.replace(/^https?:\/\//, "");
      const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
      // Fallback: also try regular open after a tick
      setTimeout(() => {
        window.open(url, "_blank");
      }, 800);
    } else if (platform === "ios") {
      // iOS: try x-safari-https scheme to open Safari directly
      const safariUrl = url.replace(/^https?:\/\//, "x-safari-https://").replace(/^x-safari-https:\/\//, "x-safari-https://");
      window.location.href = url.replace(/^https/, "x-safari-https");
    } else {
      window.open(url, "_blank");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("লিংক কপি হয়েছে! ব্রাউজারে পেস্ট করুন");
    } catch {
      toast.error("কপি করা যায়নি");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inapp-title"
    >
      <div className="w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Chrome className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 id="inapp-title" className="font-bold text-base leading-tight">
                ভালো অভিজ্ঞতার জন্য Chrome এ খুলুন
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                লগইন ও সব ফিচার ঠিকভাবে চালাতে এক্সটার্নাল ব্রাউজার দরকার
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="বন্ধ করুন"
            className="p-2 -m-2 rounded-lg hover:bg-muted transition-colors shrink-0"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <Button onClick={openExternal} size="lg" className="w-full gap-2 h-12 font-semibold">
            <ExternalLink className="h-5 w-5" />
            {platform === "ios" ? "Safari তে খুলুন" : "Chrome এ খুলুন"}
          </Button>

          {platform === "ios" && (
            <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground">কাজ না করলে নিচের ধাপ অনুসরণ করুন:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>নিচে ডানদিকে <strong>•••</strong> মেনুতে ট্যাপ করুন</li>
                <li><strong>"Open in Browser"</strong> বা <strong>"Open in Safari"</strong> চাপুন</li>
              </ol>
            </div>
          )}

          {platform === "android" && (
            <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground">কাজ না করলে নিচের ধাপ অনুসরণ করুন:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>উপরে ডানদিকে <strong>⋮</strong> মেনুতে ট্যাপ করুন</li>
                <li><strong>"Open in external browser"</strong> অথবা <strong>"Open in Chrome"</strong> চাপুন</li>
              </ol>
            </div>
          )}

          <Button onClick={copyLink} variant="outline" size="sm" className="w-full gap-2">
            <Copy className="h-4 w-4" />
            লিংক কপি করুন
          </Button>

          <button
            onClick={dismiss}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
          >
            পরে দেখব
          </button>
        </div>
      </div>
    </div>
  );
};

export default InAppBrowserPrompt;