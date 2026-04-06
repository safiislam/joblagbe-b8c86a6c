import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Loader2 } from "lucide-react";

interface PhoneOtpFormProps {
  action: "signup" | "login";
  fullName?: string;
  role?: string;
  onSuccess: (session: any) => void;
  disabled?: boolean;
}

const PhoneOtpForm = ({ action, fullName, role, onSuccess, disabled }: PhoneOtpFormProps) => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhone = (input: string) => {
    // Remove non-digits
    let digits = input.replace(/\D/g, "");
    // If starts with +88 or 88, normalize
    if (digits.startsWith("88")) digits = digits;
    else if (digits.startsWith("0")) digits = "880" + digits.slice(1);
    else if (digits.length === 10) digits = "880" + digits;
    return digits;
  };

  const handleSendOtp = async () => {
    const formatted = formatPhone(phone);
    if (!/^880\d{10}$/.test(formatted)) {
      toast.error("সঠিক ফোন নম্বর দিন (যেমন: 01XXXXXXXXX)");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone: formatted },
      });

      if (error || data?.error) {
        toast.error(data?.error || "OTP পাঠাতে ব্যর্থ। আবার চেষ্টা করুন।");
      } else {
        toast.success("OTP পাঠানো হয়েছে!");
        setStep("otp");
        setCountdown(60);
      }
    } catch (err) {
      toast.error("কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("৬ ডিজিটের OTP দিন");
      return;
    }

    const formatted = formatPhone(phone);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: {
          phone: formatted,
          otp,
          action,
          full_name: fullName,
          role: role,
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || "OTP ভেরিফাই ব্যর্থ");
      } else if (data?.session) {
        // Set the session in the client
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        toast.success(action === "signup" ? "অ্যাকাউন্ট তৈরি হয়েছে!" : "লগইন সফল!");
        onSuccess(data.session);
      }
    } catch (err) {
      toast.error("কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <>
          <div>
            <Label htmlFor="phone">ফোন নম্বর</Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="pl-10 rounded-xl"
                disabled={disabled}
              />
            </div>
          </div>
          <Button
            onClick={handleSendOtp}
            disabled={loading || !phone || disabled}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl py-2.5"
          >
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />পাঠানো হচ্ছে...</> : "OTP পাঠান"}
          </Button>
        </>
      ) : (
        <>
          <div>
            <Label htmlFor="otp">OTP কোড</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="৬ ডিজিটের কোড"
              className="mt-1.5 rounded-xl text-center text-lg tracking-widest"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {formatPhone(phone)} নম্বরে OTP পাঠানো হয়েছে
            </p>
          </div>
          <Button
            onClick={handleVerifyOtp}
            disabled={loading || otp.length !== 6}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl py-2.5"
          >
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />ভেরিফাই হচ্ছে...</> : "ভেরিফাই করুন"}
          </Button>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(""); }}
              className="text-xs text-primary hover:underline"
            >
              নম্বর পরিবর্তন
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={countdown > 0 || loading}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              {countdown > 0 ? `আবার পাঠান (${countdown}s)` : "আবার OTP পাঠান"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PhoneOtpForm;
