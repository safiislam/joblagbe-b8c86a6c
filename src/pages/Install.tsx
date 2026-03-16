import { useState, useEffect } from "react";
import { Download, Smartphone, Share, MoreVertical, Plus, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">অ্যাপ ইনস্টল করুন</h1>
          <p className="text-muted-foreground text-lg">
            Job লাগবে অ্যাপ আপনার ফোনে ইনস্টল করুন — নোটিফিকেশন পান, দ্রুত অ্যাক্সেস করুন!
          </p>
        </div>

        {isInstalled ? (
          <div className="rounded-2xl border bg-card p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">অ্যাপ ইতিমধ্যে ইনস্টল হয়েছে! 🎉</h2>
            <p className="text-muted-foreground">আপনি হোম স্ক্রিন থেকে Job লাগবে অ্যাপ ওপেন করতে পারবেন।</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Direct install button for supported browsers */}
            {deferredPrompt && (
              <div className="rounded-2xl border bg-card p-6 text-center">
                <Button onClick={handleInstall} size="lg" className="gap-2 text-base px-8">
                  <Download className="h-5 w-5" /> এখনই ইনস্টল করুন
                </Button>
              </div>
            )}

            {/* iOS instructions */}
            {isIOS && (
              <div className="rounded-2xl border bg-card p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Share className="h-5 w-5 text-primary" /> iPhone / iPad এ ইনস্টল
                </h3>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                    <span>Safari ব্রাউজারে এই পেজ ওপেন করুন</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                    <span className="flex items-center gap-1">নিচের <Share className="h-4 w-4 inline" /> Share বাটনে ক্লিক করুন</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                    <span className="flex items-center gap-1"><Plus className="h-4 w-4 inline" /> "Add to Home Screen" এ ট্যাপ করুন</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Android instructions */}
            {!isIOS && !deferredPrompt && (
              <div className="rounded-2xl border bg-card p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <MoreVertical className="h-5 w-5 text-primary" /> Android এ ইনস্টল
                </h3>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                    <span>Chrome ব্রাউজারে এই পেজ ওপেন করুন</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                    <span className="flex items-center gap-1">উপরে <MoreVertical className="h-4 w-4 inline" /> মেনুতে ক্লিক করুন</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                    <span>"Install app" বা "Add to Home Screen" এ ট্যাপ করুন</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Benefits */}
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="font-bold text-lg mb-4">কেন ইনস্টল করবেন?</h3>
              <ul className="space-y-3">
                {[
                  "🔔 নতুন চাকরির নোটিফিকেশন পান",
                  "⚡ দ্রুত লোড হয়, অফলাইনেও কাজ করে",
                  "📱 হোম স্ক্রিন থেকে এক ট্যাপে ওপেন করুন",
                  "💾 ফোনে কম জায়গা লাগে",
                ].map((text, i) => (
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
