import { useState, useEffect } from "react";
import { Download, Smartphone, Share, MoreVertical, Plus, CheckCircle2, ArrowRight, Monitor, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop";

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
};

const defaultContent = {
  title: "অ্যাপ ইনস্টল করুন",
  subtitle: "Job লাগবে অ্যাপ আপনার ডিভাইসে ইনস্টল করুন — নোটিফিকেশন পান, দ্রুত অ্যাক্সেস করুন!",
  installed_title: "অ্যাপ ইতিমধ্যে ইনস্টল হয়েছে! 🎉",
  installed_desc: "আপনি হোম স্ক্রিন থেকে Job লাগবে অ্যাপ ওপেন করতে পারবেন।",
  install_btn: "এখনই ইনস্টল করুন",
  benefits: [
    "🔔 নতুন চাকরির নোটিফিকেশন পান",
    "⚡ দ্রুত লোড হয়, অফলাইনেও কাজ করে",
    "📱 হোম স্ক্রিন থেকে এক ট্যাপে ওপেন করুন",
    "💾 ফোনে কম জায়গা লাগে (মাত্র কয়েক MB)",
    "🔒 নিরাপদ ও আপডেট স্বয়ংক্রিয়",
  ],
};

const StepItem = ({ step, children }: { step: number; children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
      {step}
    </span>
    <span className="pt-0.5">{children}</span>
  </li>
);

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installing, setInstalling] = useState(false);

  const { data: cmsContent } = useQuery({
    queryKey: ["site-content", "install_page"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "install_page")
        .maybeSingle();
      return data?.content as typeof defaultContent | null;
    },
  });

  const c = { ...defaultContent, ...cmsContent };

  useEffect(() => {
    setPlatform(detectPlatform());

    if (window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => setIsInstalled(true);

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
    } finally {
      setDeferredPrompt(null);
      setInstalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-5">
            <Download className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{c.title}</h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">{c.subtitle}</p>
        </div>

        {isInstalled ? (
          <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{c.installed_title}</h2>
            <p className="text-muted-foreground">{c.installed_desc}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* One-click install button (Android Chrome / Desktop Chrome) */}
            {deferredPrompt && (
              <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 text-center shadow-sm">
                <p className="text-sm text-muted-foreground mb-3">এক ক্লিকে ইনস্টল করুন</p>
                <Button
                  onClick={handleInstall}
                  size="lg"
                  disabled={installing}
                  className="gap-2 text-base px-10 h-12 font-semibold"
                >
                  <Download className="h-5 w-5" />
                  {installing ? "ইনস্টল হচ্ছে..." : c.install_btn}
                </Button>
              </div>
            )}

            {/* iOS instructions */}
            {platform === "ios" && (
              <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Share className="h-5 w-5 text-primary" /> iPhone / iPad এ ইনস্টল করুন
                </h3>
                <ol className="space-y-4">
                  <StepItem step={1}><strong>Safari</strong> ব্রাউজারে এই পেজ ওপেন করুন</StepItem>
                  <StepItem step={2}>
                    <span className="inline-flex items-center gap-1 flex-wrap">নিচের <Share className="h-4 w-4" /> <strong>Share</strong> বাটনে ট্যাপ করুন</span>
                  </StepItem>
                  <StepItem step={3}>
                    <span className="inline-flex items-center gap-1 flex-wrap"><Plus className="h-4 w-4" /> <strong>"Add to Home Screen"</strong> এ ট্যাপ করুন</span>
                  </StepItem>
                  <StepItem step={4}><strong>"Add"</strong> চাপুন — হোম স্ক্রিনে অ্যাপ আইকন দেখাবে!</StepItem>
                </ol>
              </div>
            )}

            {/* Android instructions */}
            {platform === "android" && (
              <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Chrome className="h-5 w-5 text-primary" /> Android এ ইনস্টল করুন
                </h3>
                {deferredPrompt && (
                  <p className="text-sm text-muted-foreground mb-3">
                    উপরের <strong>"এখনই ইনস্টল করুন"</strong> বাটনে ক্লিক করুন। অথবা নিচের ধাপ অনুসরণ করুন:
                  </p>
                )}
                <ol className="space-y-4">
                  <StepItem step={1}><strong>Chrome</strong> ব্রাউজারে এই পেজ ওপেন করুন</StepItem>
                  <StepItem step={2}>
                    <span className="inline-flex items-center gap-1 flex-wrap">উপরে <MoreVertical className="h-4 w-4" /> মেনু (তিন ডট) এ ট্যাপ করুন</span>
                  </StepItem>
                  <StepItem step={3}><strong>"Install app"</strong> বা <strong>"Add to Home Screen"</strong> এ ট্যাপ করুন</StepItem>
                  <StepItem step={4}><strong>"Install"</strong> চাপুন — হোম স্ক্রিনে অ্যাপ যোগ হবে!</StepItem>
                </ol>
              </div>
            )}

            {/* Desktop instructions */}
            {platform === "desktop" && !deferredPrompt && (
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" /> কম্পিউটারে ইনস্টল
                </h3>
                <ol className="space-y-4">
                  <StepItem step={1}><strong>Chrome</strong> বা <strong>Edge</strong> ব্রাউজারে এই পেজ ওপেন করুন</StepItem>
                  <StepItem step={2}>Address bar এর ডানে <Download className="h-4 w-4 inline" /> আইকন দেখলে ক্লিক করুন</StepItem>
                  <StepItem step={3}><strong>"Install"</strong> চাপুন — ডেস্কটপে অ্যাপ শর্টকাট তৈরি হবে!</StepItem>
                </ol>
              </div>
            )}

            {/* Mobile prompt for desktop users */}
            {platform === "desktop" && (
              <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 text-center shadow-sm">
                <Smartphone className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">মোবাইলে ইনস্টল করতে চান?</p>
                <p className="text-xs text-muted-foreground">
                  আপনার ফোনের ব্রাউজারে <strong>joblagbe.lovable.app/install</strong> ওপেন করুন
                </p>
              </div>
            )}

            {/* Benefits */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">কেন ইনস্টল করবেন?</h3>
              <ul className="space-y-3">
                {(c.benefits || []).map((text: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Install;
